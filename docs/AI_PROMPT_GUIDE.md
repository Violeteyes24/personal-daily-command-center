# AI Prompt Guide 🤖

This document provides context for AI assistants (GitHub Copilot, ChatGPT, Claude, etc.) to help maintain consistency and follow project conventions.

## 📋 Project Overview

**Personal Daily Command Center** is a life dashboard built with:
- **Next.js 15** (App Router with Server Components & Server Actions)
- **TypeScript** (strict mode)
- **TailwindCSS v4** (utility-first styling)
- **Prisma** (PostgreSQL ORM)
- **Clerk** (authentication)
- **ShadCN UI** (component library)
- **Zod** (validation)

---

## 🏗️ Architecture Principles

### SOLID Principles Applied

| Principle | How We Apply It |
|-----------|-----------------|
| **Single Responsibility** | Each file does ONE thing. `actions/tasks.ts` only handles task CRUD. |
| **Open/Closed** | Components accept props for customization, not modification. |
| **Liskov Substitution** | All action functions return `ActionResponse<T>` type. |
| **Interface Segregation** | Small, focused interfaces in `types/index.ts`. |
| **Dependency Inversion** | Components depend on abstractions (props), not concrete implementations. |

### DRY (Don't Repeat Yourself)

- **Shared components** → `src/components/shared/`
- **Utility functions** → `src/lib/utils.ts`
- **Validation schemas** → `src/lib/validations/`
- **Constants** → `src/constants/`
- **Types** → `src/types/`

---

## 📁 File Organization Rules

### Where to Put New Code

| Type of Code | Location | Example |
|--------------|----------|---------|
| Page/Route | `src/app/(dashboard)/dashboard/[feature]/page.tsx` | `tasks/page.tsx` |
| Server Action | `src/actions/[feature].ts` | `tasks.ts` |
| Validation Schema | `src/lib/validations/[feature].ts` | `task.ts` |
| Feature Form | `src/components/forms/[feature]-form.tsx` | `task-form.tsx` |
| Feature Component | `src/components/[feature]/` | `components/tasks/` |
| Shared/Reusable | `src/components/shared/` | `loading.tsx` |
| UI Primitives | `src/components/ui/` | ShadCN components |
| Custom Hook | `src/hooks/use-[name].ts` | `use-tasks.ts` |
| Type Definition | `src/types/index.ts` | Add to existing file |
| Constants | `src/constants/categories.ts` | Add to existing or new file |

### Naming Conventions

```
Files:        kebab-case        → task-form.tsx, use-tasks.ts
Components:   PascalCase        → TaskForm, TaskList
Functions:    camelCase         → createTask, getTasks
Types:        PascalCase        → Task, CreateTaskInput
Constants:    SCREAMING_SNAKE   → EXPENSE_CATEGORIES
Actions:      verbNoun          → createTask, deleteHabit
```

---

## 🔧 Code Patterns

### Server Action Pattern

All server actions follow this pattern:

```typescript
"use server";

import { db } from "@/lib/db";
import { createXxxSchema } from "@/lib/validations/xxx";
import type { ActionResponse, Xxx } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createXxx(input: unknown): Promise<ActionResponse<Xxx>> {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validate input
    const validated = createXxxSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // 3. Database operation
    const result = await db.xxx.create({
      data: { ...validated.data, userId },
    });

    // 4. Revalidate cache
    revalidatePath("/dashboard");
    revalidatePath("/xxx");

    // 5. Return success
    return { success: true, data: result as Xxx };
  } catch (error) {
    console.error("Failed to create xxx:", error);
    return { success: false, error: "Failed to create xxx" };
  }
}
```

### Validation Schema Pattern

```typescript
import { z } from "zod";

export const createXxxSchema = z.object({
  field: z.string().min(1, "Required").max(200, "Too long"),
  optionalField: z.string().optional(),
  enumField: z.enum(["a", "b", "c"]).default("a"),
  dateField: z.coerce.date().optional(),
});

export const updateXxxSchema = createXxxSchema.partial().extend({
  id: z.string(),
});

export type CreateXxxInput = z.infer<typeof createXxxSchema>;
export type UpdateXxxInput = z.infer<typeof updateXxxSchema>;
```

### Component Pattern

```typescript
// Client component (with interactivity)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface XxxProps {
  data: SomeType;
  onAction?: () => void;
}

export function Xxx({ data, onAction }: XxxProps) {
  const [loading, setLoading] = useState(false);
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

```typescript
// Server component (no "use client", can be async)
import { getXxx } from "@/actions/xxx";

export default async function XxxPage() {
  const result = await getXxx();
  
  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }
  
  return <XxxList data={result.data} />;
}
```

---

## 🗄️ Database Schema Reference

### Models

```prisma
User          → id mod (Clerk), email, firstName, lastName, imageUrl
Task          → id, userId, title, description, priority, dueDate, completed
Habit         → id, userId, name, icon, frequency, targetDays[], archived
HabitLog      → id, habitId, date, completed
Expense       → id, userId, amount, category, note, date
Note          → id, userId, title, content, tags[], pinned
MoodEntry     → id, userId, mood (1-5), energy (1-5), note, date
```

### Enums

```prisma
Priority: low | medium | high
Frequency: daily | weekly
```

---

## 🎨 UI/Styling Guidelines

### TailwindCSS Conventions

- Use **ShadCN components** for all UI primitives (Button, Card, Input, etc.)
- Use `cn()` utility for conditional classes:
  ```typescript
  import { cn } from "@/lib/utils";
  
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- Follow mobile-first responsive design: `sm:`, `md:`, `lg:`

### Color Semantic Classes

```
bg-primary / text-primary-foreground    → Primary actions
bg-secondary / text-secondary-foreground → Secondary
bg-muted / text-muted-foreground        → Subdued content
bg-destructive                          → Danger/delete
bg-card                                 → Card backgrounds
```

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't mix Server and Client code**
   - Server Actions = `"use server"` at top
   - Client Components = `"use client"` at top
   - Server Components = no directive (default)

2. **Always validate with Zod** before database operations

3. **Always check authentication** in server actions:
   ```typescript
   const { userId } = await auth();
   if (!userId) return { success: false, error: "Unauthorized" };
   ```

4. **Use proper TypeScript types** - avoid `any`

5. **Revalidate paths** after mutations:
   ```typescript
   revalidatePath("/dashboard");
   ```

6. **Handle errors gracefully** - always return ActionResponse

---

## 🚀 Adding a New Feature Checklist

When adding a new feature (e.g., "Goals"):

- [ ] Add Prisma model in `prisma/schema.prisma`
- [ ] Run `npx prisma db push` and `npx prisma generate`
- [ ] Create types in `src/types/index.ts`
- [ ] Create validation schemas in `src/lib/validations/goal.ts`
- [ ] Create server actions in `src/actions/goals.ts`
- [ ] Export from `src/actions/index.ts`
- [ ] Create page at `src/app/(dashboard)/dashboard/goals/page.tsx`
- [ ] Add to sidebar in `src/components/layouts/sidebar.tsx`
- [ ] Create form component in `src/components/forms/goal-form.tsx`
- [ ] Add constants if needed in `src/constants/`

---

## 📝 Example Prompts for AI

### Good Prompts ✅

```
"Add a delete confirmation dialog to the task item component. 
Use the existing ConfirmDialog from shared components."

"Create a TaskForm component in src/components/forms/ that 
uses the createTaskSchema for validation and calls createTask action."

"Add a 'tags' filter to the notes page. Follow the existing 
pattern in expenses page for category filtering."
```

### Bad Prompts ❌

```
"Make the tasks better" → Too vague

"Create a new database" → We use Prisma, be specific

"Add authentication" → Already using Clerk
```

---

## 📚 Reference Links

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Clerk Docs](https://clerk.com/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Zod Docs](https://zod.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
