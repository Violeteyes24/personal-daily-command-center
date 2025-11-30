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

### Step 5: Page Component

Create `src/app/(dashboard)/dashboard/goals/page.tsx`:

```typescript
import { getGoals } from "@/actions/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function GoalsPage() {
  const result = await getGoals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Track your long-term goals.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {result.success && result.data?.length ? (
            // Render goals
            <div>Goals list here</div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No goals yet. Create your first goal!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 6: Add to Navigation

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

### Step 7: Create Form Component (Optional)

Create `src/components/forms/goal-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { createGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
