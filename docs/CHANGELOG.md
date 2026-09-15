# Development Changelog 📋

Track of what has been implemented, what's in progress, and what's planned.

---

## Version 0.5.0 - Expense Tracker Upgrade

### 🐛 Fixed

Date handling was the root cause of three reporting errors. All calendar dates
now flow through `src/lib/dates.ts`, which pins them to UTC midnight instead of
treating them as instants.

- **Expenses logged before 08:00 saved to the previous day.** `@db.Date` takes
  the UTC date part of a local `Date`, so in UTC+8 a 7 AM entry rolled back a
  day.
- **The last day of every month was missing from totals.** `new Date(y, m+1, 0)`
  resolved to the 29th in UTC+8 for September, and pulled in the previous
  month's last day instead.
- **Month navigation skipped months.** `parse(month, "yyyy-MM", new Date())`
  inherited today's day-of-month, so on the 31st stepping to February landed on
  March 3. Same overflow fixed in monthly recurring tasks.
- **`revalidatePath("/expenses")` pointed at a route that does not exist.**
  Mutations never invalidated the page cache. The same dead path was fixed for
  habits, mood, notes and tasks.
- **Money stored as `Float`** drifted when summed. Now `Decimal(12,2)`, with
  centavo-exact arithmetic in `src/lib/money.ts`.
- **`getTodayExpenses` counted tomorrow's expenses** (`lte: tomorrow`).
- **Editing an expense showed the wrong category** — the `<Select>` used
  `defaultValue`, so Radix kept its own stale state across `form.reset()`.
- **Changing a budget goal's category silently overwrote** an existing goal for
  the target category, then deleted the old row in a separate call. Now one
  atomic `moveBudgetGoal` that refuses the collision.
- **Duplicate "overall" budgets were possible** — nullable `category` in a
  unique index is not deduplicated by Postgres. `category` is now NOT NULL with
  an `"overall"` sentinel, so the database enforces it.
- **Chart tooltips were invisible in dark mode** — `hsl(var(--popover))` against
  OKLCH theme variables is an invalid colour. Fixed in the expense, report and
  mood charts.
- **The pie chart mutated its props** (`data.sort()` on the same array the
  budget card rendered from) and coloured slices by rank, so a category changed
  colour month to month. Colours are now keyed to the category.
- **Filtering by category left the totals unfiltered**, so the headline number
  and the list below it disagreed.

### ✨ Added

- **Accounts** — attribute each expense to a wallet, bank or card. Seeded with
  GCash (emergency-only), Maya, Maribank, Tonik, GoTyme, BPI Savings and BPI
  Credit Card; managed from Settings. Per-account balances, an account filter,
  and an amber warning when an emergency-only account is used.
- **Recurring expenses** — templates that materialise on page load, catching up
  after any gap. Idempotent, transactional, and capped so a dormant series
  cannot flood the log.
- **Analytics** — cumulative spend-over-month chart with the budget drawn on it,
  month-over-month comparison, average per day, and budget pacing ("₱X ahead of
  pace"). Budget status now appears on the dashboard.

### 🧪 Testing

First tests in the repo: `npm test` runs the date and recurrence logic on
Node's built-in runner, no framework or build step. 33 assertions pin the three
confirmed date bugs.

### ⚠️ Migration

`prisma/migrate-expenses-upgrade.sql` must be run **before** `npx prisma db push`.
It collapses duplicate overall budgets and replaces `NULL` categories with the
`"overall"` sentinel.

---

## Version 0.1.0 - Foundation (Current)

**Date**: November 30, 2025

### ✅ Completed

#### Project Setup
- [x] Next.js 15 with App Router
- [x] TypeScript configuration
- [x] TailwindCSS v4 setup
- [x] ESLint configuration
- [x] Project folder structure (SOLID/DRY principles)

#### Database
- [x] Prisma ORM setup
- [x] PostgreSQL schema design
- [x] Models: User, Task, Habit, HabitLog, Expense, Note, MoodEntry
- [x] Database indexes for performance

#### Authentication
- [x] Clerk integration
- [x] Middleware for route protection
- [x] Sign-in / Sign-up pages
- [x] User sync helper functions

#### UI Components
- [x] ShadCN UI setup
- [x] Core components installed (Button, Card, Input, Dialog, etc.)
- [x] Sidebar navigation
- [x] Header with user menu
- [x] Shared components (Loading, EmptyState, ConfirmDialog)

#### Pages
- [x] Landing page
- [x] Dashboard page (placeholder)
- [x] Tasks page (placeholder)
- [x] Habits page (placeholder)
- [x] Expenses page (placeholder)
- [x] Notes page (placeholder)
- [x] Mood page (placeholder)
- [x] Settings page (placeholder)

#### Server Actions
- [x] Tasks CRUD (create, read, update, delete, toggle)
- [x] Habits CRUD + logging
- [x] Expenses CRUD + stats
- [x] Notes CRUD + pin toggle
- [x] Mood entries CRUD

#### Validation
- [x] Zod schemas for all models
- [x] Type inference from schemas

#### Documentation
- [x] README.md
- [x] AI_PROMPT_GUIDE.md
- [x] ARCHITECTURE.md
- [x] CONTRIBUTING.md
- [x] SETUP.md
- [x] CHANGELOG.md

---

## Version 0.2.0 - Core Features (Next)

### 🚧 In Progress

- [ ] Database connection (waiting for user to set up Clerk + DB)
- [ ] Initial migration

### 📋 Planned

#### Tasks Feature
- [ ] Task list component with filtering
- [ ] Task form with validation
- [ ] Task item with checkbox, edit, delete
- [ ] Priority badges
- [ ] Due date display
- [ ] Today/Tomorrow filter

#### Habits Feature
- [ ] Habit list with today's status
- [ ] Habit form
- [ ] Daily check-off functionality
- [ ] Streak calculation and display
- [ ] Habit calendar/heatmap view

#### Expenses Feature
- [ ] Expense list with category icons
- [ ] Quick expense form
- [ ] Category filter
- [ ] Date range filter
- [ ] Monthly summary stats
- [ ] Expense chart (pie chart by category)

#### Notes Feature
- [ ] Notes grid/list view
- [ ] Note form with tags
- [ ] Tag filtering
- [ ] Pin/unpin functionality
- [ ] Search notes

#### Mood Feature
- [ ] Daily mood selector (emoji picker)
- [ ] Energy level selector
- [ ] Mood history calendar
- [ ] Mood trend chart

#### Dashboard
- [ ] Real data in stat cards
- [ ] Today's tasks widget
- [ ] Today's habits widget
- [ ] Quick expense entry
- [ ] Mood check-in prompt

---

## Version 0.3.0 - Polish (Future)

### 📋 Planned

- [ ] Dark mode toggle
- [ ] Mobile responsive improvements
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Toast notifications for all actions
- [ ] Keyboard shortcuts
- [ ] Data export (JSON/CSV)

---

## Version 0.4.0 - Advanced Features (Future)

### 📋 Planned

- [ ] Weekly/Monthly reports
- [ ] Charts and analytics
- [ ] Recurring tasks
- [ ] Habit reminders
- [ ] Budget goals for expenses
- [ ] Note categories
- [ ] Search across all features

---

## Version 1.0.0 - Production Ready (Future)

### 📋 Planned

- [ ] PWA support (offline, installable)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Production deployment guide
- [ ] Automated testing
- [ ] CI/CD pipeline

---

## Tech Debt & Improvements

- [ ] Add React Query/SWR for client-side caching
- [ ] Implement optimistic updates
- [ ] Add pagination for large lists
- [ ] Rate limiting for API actions
- [ ] Error logging service integration
- [ ] Analytics integration
