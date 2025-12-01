# Architecture Guide 🏗️

This document explains the system design, data flow, and architectural decisions of the Personal Daily Command Center.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────────┤
│  React Components (Server + Client)                                 │
│  ├── Server Components: Fetch data, render HTML                     │
│  └── Client Components: Interactivity, forms, state                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Next.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Server Actions (src/actions/)                                      │
│  ├── Authentication check (Clerk)                                   │
│  ├── Input validation (Zod)                                         │
│  ├── Database operations (Prisma)                                   │
│  └── Cache revalidation                                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────────────┤
│  Users, Tasks, Habits, HabitLogs, Expenses, Notes, MoodEntries     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Read Operation (Fetching Data)

```
1. User navigates to /dashboard/tasks
2. Server Component (page.tsx) executes
3. Server calls getTasks() action
4. Action checks auth via Clerk
5. Action queries Prisma → PostgreSQL
6. Data returned to component
7. HTML rendered and sent to client
```

### Write Operation (Creating/Updating)

```
1. User fills form and submits
2. Client Component calls Server Action
3. Action validates input with Zod
4. Action checks auth via Clerk
5. Action performs Prisma mutation
6. Action calls revalidatePath()
7. Next.js invalidates cache
8. UI updates automatically
```

---

## Directory Architecture

```
src/
├── app/                          # ROUTING LAYER
│   │                             # Next.js App Router - file-based routing
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── (dashboard)/              # Route group for protected pages
│   │   └── dashboard/
│   │       ├── layout.tsx        # Dashboard layout with sidebar
│   │       ├── page.tsx          # Main dashboard
│   │       ├── tasks/page.tsx
│   │       ├── habits/page.tsx
│   │       ├── expenses/page.tsx
│   │       ├── notes/page.tsx
│   │       ├── mood/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── layout.tsx                # Root layout (providers)
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── actions/                      # BUSINESS LOGIC LAYER
│   │                             # Server Actions - backend logic
│   ├── tasks.ts                  # Task CRUD operations
│   ├── habits.ts                 # Habit + HabitLog operations
│   ├── expenses.ts               # Expense operations + stats
│   ├── notes.ts                  # Note operations
│   ├── mood.ts                   # Mood entry operations
│   └── index.ts                  # Barrel export
│
├── components/                   # PRESENTATION LAYER
│   ├── ui/                       # Primitive UI components (ShadCN)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (ShadCN components)
│   │
│   ├── layouts/                  # Layout components
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── header.tsx            # Top header with user menu
│   │   └── index.ts
│   │
│   ├── tasks/                    # Task feature components
│   │   ├── task-form.tsx         # Create/Edit task dialog
│   │   ├── task-card.tsx         # Single task display
│   │   ├── task-list.tsx         # List of tasks with empty state
│   │   ├── tasks-client.tsx      # Client container with state
│   │   └── index.ts              # Barrel export
│   │
│   ├── habits/                   # Habit feature components (same pattern)
│   │   ├── habit-form.tsx
│   │   ├── habit-card.tsx
│   │   ├── habit-list.tsx
│   │   ├── habits-client.tsx
│   │   └── index.ts
│   │
│   ├── expenses/                 # Expense feature components (same pattern)
│   │   └── ...
│   │
│   ├── dashboard/                # Dashboard-specific widgets
│   │   ├── stat-card.tsx
│   │   ├── task-widget.tsx
│   │   └── habit-widget.tsx
│   │
│   └── shared/                   # Reusable across features
│       ├── loading.tsx           # Loading spinner/page
│       ├── empty-state.tsx       # Empty state placeholder
│       ├── confirm-dialog.tsx    # Confirmation modal
│       └── index.ts
│
├── lib/                          # UTILITIES LAYER
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Auth helpers (getCurrentUser, syncUser)
│   ├── utils.ts                  # General utilities (cn, formatDate, etc.)
│   └── validations/              # Zod schemas
│       ├── task.ts
│       ├── habit.ts
│       ├── expense.ts
│       ├── note.ts
│       ├── mood.ts
│       └── index.ts
│
├── constants/                    # CONFIGURATION LAYER
│   ├── categories.ts             # Expense categories, priorities, etc.
│   └── index.ts
│
├── hooks/                        # CUSTOM HOOKS (to be created)
│   ├── use-tasks.ts
│   └── use-debounce.ts
│
├── types/                        # TYPE DEFINITIONS
│   └── index.ts                  # All TypeScript interfaces
│
└── middleware.ts                 # Auth middleware (Clerk)
```

---

## Key Design Decisions

### 1. Server Actions over API Routes

**Why Server Actions?**
- Simpler mental model (no REST endpoints)
- Type-safe end-to-end
- Automatic request handling
- Better integration with Server Components
- Progressive enhancement (works without JS)

**Pattern:**
```typescript
// Instead of: fetch('/api/tasks', { method: 'POST', body: ... })
// We use:
const result = await createTask(formData);
```

### 2. Validation at the Edge

All input is validated with Zod schemas before touching the database:

```typescript
const validated = createTaskSchema.safeParse(input);
if (!validated.success) {
  return { success: false, error: validated.error.issues[0].message };
}
```

**Benefits:**
- Type inference from schemas
- Consistent error messages
- Protection against invalid data
- Schema reuse (client + server)

### 3. Centralized Auth Check

Every server action starts with:

```typescript
const { userId } = await auth();
if (!userId) {
  return { success: false, error: "Unauthorized" };
}
```

**Benefits:**
- Single pattern to remember
- Can't forget auth check
- Middleware handles route protection
- Actions handle data-level protection

### 4. ActionResponse Pattern

All actions return the same shape:

```typescript
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Benefits:**
- Predictable error handling
- Easy to check: `if (result.success) { ... }`
- TypeScript knows the type of `data`
- Consistent across all features

### 5. Feature Component Pattern

Each feature follows the same component structure:

```
components/
└── {feature}/                    # e.g., tasks/, habits/, expenses/
    ├── {feature}-form.tsx        # Create/Edit modal dialog
    ├── {feature}-card.tsx        # Single item display
    ├── {feature}-list.tsx        # List with empty state handling
    ├── {feature}s-client.tsx     # Client container with all state/handlers
    └── index.ts                  # Barrel export
```

**Component Responsibilities:**

| Component | Server/Client | Purpose |
|-----------|---------------|---------|
| `{feature}-form.tsx` | Client | Modal dialog with form, validation, submit handling |
| `{feature}-card.tsx` | Client | Display single item with actions dropdown |
| `{feature}-list.tsx` | Client | Render list of cards, handle empty state |
| `{feature}s-client.tsx` | Client | State management, action handlers, compose other components |
| `page.tsx` | Server | Fetch data, pass to client component |

**Data Flow Pattern:**

```
Server Component (page.tsx)
    │
    │ Fetches data via Server Action
    ▼
Client Container ({feature}s-client.tsx)
    │
    │ Manages state: isFormOpen, editingItem, deleteId
    │ Defines handlers: handleCreate, handleUpdate, handleDelete
    ▼
├── {Feature}List
│       │
│       └── {Feature}Card (for each item)
│
├── {Feature}Form (dialog, controlled by isFormOpen)
│
└── ConfirmDialog (delete confirmation)
```

**Example: Tasks Page Flow**

```typescript
// 1. Server Component fetches data
// app/(dashboard)/dashboard/tasks/page.tsx
export default async function TasksPage() {
  const result = await getTasks();
  const tasks = result.success ? result.data ?? [] : [];
  return <TasksClient initialTasks={tasks} />;
}

// 2. Client Container manages all interactions
// components/tasks/tasks-client.tsx
export function TasksClient({ initialTasks }: TasksClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const handleCreate = async (data: CreateTaskInput) => {
    const result = await createTask(data);
    if (result.success) {
      toast.success("Task created");
      router.refresh(); // Triggers server refetch
    }
  };
  
  return (
    <>
      <TaskList tasks={initialTasks} onEdit={handleEdit} ... />
      <TaskForm open={isFormOpen} onSubmit={handleCreate} ... />
    </>
  );
}
```

**Benefits:**
- Clear separation of concerns
- Server handles data fetching (efficient, secure)
- Client handles interactivity (responsive, instant feedback)
- Reusable pattern across all features
- Easy to test components in isolation

### 6. Route Groups for Layout Separation

```
app/
├── (auth)/         # No sidebar, centered layout
└── (dashboard)/    # Sidebar, header, protected
```

**Benefits:**
- Different layouts per section
- Clean URL structure
- Logical code organization

---

## Database Schema Design

### Entity Relationships

```
User (1) ─────┬───── (*) Task
              ├───── (*) Habit ────── (*) HabitLog
              ├───── (*) Expense
              ├───── (*) Note
              └───── (*) MoodEntry
```

### Key Design Choices

1. **User ID from Clerk** - No password storage, Clerk handles auth
2. **Soft delete not implemented** - Simple delete for MVP
3. **Date fields as `@db.Date`** - Store date only, not datetime for daily entries
4. **Unique constraints** - One mood entry per user per day
5. **Cascade deletes** - Delete user → delete all their data

---

## Security Model

### Authentication (Clerk)

```
Request → Middleware → Check Clerk Session → Allow/Redirect
```

### Authorization (Per-Action)

```
Action → Get userId → Query with userId filter → Return only user's data
```

### Data Protection

- All queries include `where: { userId }` 
- No endpoints expose other users' data
- Clerk handles session management
- Environment variables for secrets

---

## Performance Considerations

### Current Optimizations

1. **Prisma Client Singleton** - Prevents connection exhaustion
2. **Server Components** - Reduced client JS
3. **revalidatePath()** - Smart cache invalidation

### Future Optimizations

1. **React Query/SWR** - Client-side caching
2. **Optimistic Updates** - Instant UI feedback
3. **Pagination** - Large data sets
4. **Database Indexing** - Already added in schema

---

## Extending the System

### Adding a New Feature

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full checklist.

High-level steps:
1. Design the data model
2. Add Prisma schema
3. Create validation schemas
4. Implement server actions
5. Build UI components
6. Add to navigation

### Integration Points

| To Add | Integrate With |
|--------|----------------|
| New page | `app/(dashboard)/dashboard/` |
| New action | `actions/` + export in `index.ts` |
| New validation | `lib/validations/` + export |
| New component | `components/` appropriate folder |
| New nav item | `components/layouts/sidebar.tsx` |
