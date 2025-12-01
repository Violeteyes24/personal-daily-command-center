# Contributing Guide 📝

How to add new features and make changes to the Personal Daily Command Center.

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account
- VS Code (recommended)

### First Time Setup

```bash
# Clone and install
git clone <repo-url>
cd personal-daily-command-center
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### VS Code Extensions (Recommended)

- Tailwind CSS IntelliSense
- Prisma
- ESLint
- Prettier
- GitHub Copilot

---

## Adding a New Feature

Follow this checklist when adding a new feature (e.g., "Goals"):

### Step 1: Database Model

Edit `prisma/schema.prisma`:

```prisma
model Goal {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  targetDate  DateTime?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Then run:
```bash
npx prisma db push
npx prisma generate
```

### Step 2: TypeScript Types

Add to `src/types/index.ts`:

```typescript
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 3: Validation Schemas

Create `src/lib/validations/goal.ts`:

```typescript
import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.coerce.date().optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string(),
  completed: z.boolean().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
```

Export from `src/lib/validations/index.ts`:
```typescript
export * from "./goal";
```

### Step 4: Server Actions

Create `src/actions/goals.ts`:

```typescript
"use server";

import { db } from "@/lib/db";
import { createGoalSchema, updateGoalSchema } from "@/lib/validations/goal";
import type { ActionResponse, Goal } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getGoals(): Promise<ActionResponse<Goal[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const goals = await db.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: goals as Goal[] };
  } catch (error) {
    console.error("Failed to get goals:", error);
    return { success: false, error: "Failed to get goals" };
  }
}

export async function createGoal(input: unknown): Promise<ActionResponse<Goal>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createGoalSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const goal = await db.goal.create({
      data: { ...validated.data, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/goals");
    return { success: true, data: goal as Goal };
  } catch (error) {
    console.error("Failed to create goal:", error);
    return { success: false, error: "Failed to create goal" };
  }
}

// Add updateGoal, deleteGoal, toggleGoal...
```

Export from `src/actions/index.ts`:
```typescript
export * from "./goals";
```

### Step 5: Feature Components

Create the component folder `src/components/goals/` with these files:

#### goal-form.tsx (Create/Edit Dialog)

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGoalSchema, type CreateGoalInput } from "@/lib/validations/goal";
import type { Goal } from "@/types";

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGoalInput) => Promise<void>;
  defaultValues?: Partial<Goal>;
  mode?: "create" | "edit";
}

export function GoalForm({ open, onOpenChange, onSubmit, defaultValues, mode = "create" }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  const handleSubmit = async (data: CreateGoalInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Goal" : "Edit Goal"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Form fields... */}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

#### goal-card.tsx (Single Item Display)

```typescript
"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal } from "@/types";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => Promise<void>;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex-1">
          <p className="font-medium">{goal.title}</p>
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(goal)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
```

#### goal-list.tsx (List with Empty State)

```typescript
"use client";

import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { GoalCard } from "./goal-card";
import type { Goal } from "@/types";

interface GoalListProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => Promise<void>;
  onAddNew: () => void;
}

export function GoalList({ goals, onEdit, onDelete, onAddNew }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-12 w-12" />}
        title="No goals yet"
        description="Create your first goal to get started"
        action={<Button onClick={onAddNew}><Plus className="mr-2 h-4 w-4" /> Add Goal</Button>}
      />
    );
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

#### goals-client.tsx (Client Container)

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GoalForm } from "./goal-form";
import { GoalList } from "./goal-list";
import { ConfirmDialog } from "@/components/shared";
import { createGoal, updateGoal, deleteGoal } from "@/actions/goals";
import type { Goal } from "@/types";
import type { CreateGoalInput } from "@/lib/validations/goal";

interface GoalsClientProps {
  initialGoals: Goal[];
}

export function GoalsClient({ initialGoals }: GoalsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: CreateGoalInput) => {
    const result = await createGoal(data);
    if (result.success) {
      toast.success("Goal created");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error);
      throw new Error(result.error);
    }
  };

  const handleUpdate = async (data: CreateGoalInput) => {
    if (!editingGoal) return;
    const result = await updateGoal({ id: editingGoal.id, ...data });
    if (result.success) {
      toast.success("Goal updated");
      setEditingGoal(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error);
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteGoal(deleteId);
    if (result.success) {
      toast.success("Goal deleted");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Track your long-term goals.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      <GoalList
        goals={initialGoals}
        onEdit={(goal) => { setEditingGoal(goal); setIsFormOpen(true); }}
        onDelete={async (id) => setDeleteId(id)}
        onAddNew={() => setIsFormOpen(true)}
      />

      <GoalForm
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingGoal(null); }}
        onSubmit={editingGoal ? handleUpdate : handleCreate}
        defaultValues={editingGoal ?? undefined}
        mode={editingGoal ? "edit" : "create"}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Goal"
        description="Are you sure? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
```

#### index.ts (Barrel Export)

```typescript
export { GoalForm } from "./goal-form";
export { GoalCard } from "./goal-card";
export { GoalList } from "./goal-list";
export { GoalsClient } from "./goals-client";
```

### Step 6: Page Component (Server)

Create `src/app/(dashboard)/dashboard/goals/page.tsx`:

```typescript
import { getGoals } from "@/actions/goals";
import { GoalsClient } from "@/components/goals";

export default async function GoalsPage() {
  const result = await getGoals();
  const goals = result.success ? result.data ?? [] : [];

  return <GoalsClient initialGoals={goals} />;
}
```

### Step 7: Add to Navigation

Edit `src/components/layouts/sidebar.tsx`:

```typescript
import { Target } from "lucide-react"; // Add import

const navItems = [
  // ... existing items
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
];
```

---

## Feature Component Pattern Summary

Every feature follows this structure:

```
components/{feature}/
├── {feature}-form.tsx      # Dialog with form
├── {feature}-card.tsx      # Single item display  
├── {feature}-list.tsx      # List with empty state
├── {feature}s-client.tsx   # State management container
└── index.ts                # Barrel export
```

**Key Principles:**

1. **Server Component (page.tsx)** - Fetches data, passes to client
2. **Client Container** - Manages all state and handlers
3. **Form Dialog** - Uses react-hook-form + zod for validation
4. **Card Component** - Displays single item with actions dropdown
5. **List Component** - Maps cards, handles empty state
6. **Barrel Exports** - Clean imports via index.ts

---
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function GoalForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createGoal({
      title: formData.get("title"),
      description: formData.get("description"),
    });

    setLoading(false);

    if (result.success) {
      toast.success("Goal created!");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Goal"}
      </Button>
    </form>
  );
}
```

---

## Code Style Guidelines

### TypeScript

- Use strict typing, avoid `any`
- Define interfaces in `types/index.ts`
- Use type inference where obvious

### Components

- Prefer Server Components (no `"use client"` unless needed)
- Use `"use client"` only for:
  - Event handlers (onClick, onChange)
  - useState, useEffect
  - Browser APIs
- Keep components small and focused

### Styling

- Use Tailwind CSS utilities
- Use `cn()` for conditional classes
- Follow mobile-first responsive design
- Use ShadCN components as base

### Server Actions

- Always validate input with Zod
- Always check authentication
- Always return `ActionResponse<T>`
- Always handle errors gracefully
- Always `revalidatePath()` after mutations

---

## Testing (Future)

We plan to add:

- **Unit tests**: Vitest for utilities and validation
- **Component tests**: React Testing Library
- **E2E tests**: Playwright

---

## Git Workflow

### Branch Naming

```
feature/add-goals-page
fix/task-completion-bug
refactor/sidebar-navigation
docs/update-readme
```

### Commit Messages

```
feat: add goals feature
fix: resolve task toggle issue
refactor: extract TaskCard component
docs: update architecture guide
style: format with prettier
chore: update dependencies
```

---

## Troubleshooting

### Prisma Issues

```bash
# Reset database
npx prisma db push --force-reset

# Regenerate client
npx prisma generate

# View database
npx prisma studio
```

### Auth Issues

- Check `.env.local` has correct Clerk keys
- Ensure middleware.ts is present
- Check Clerk dashboard for user status

### Build Errors

```bash
# Clear cache
rm -rf .next
npm run build
```
