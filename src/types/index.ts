// Task types
export type Priority = "low" | "medium" | "high";
export type Recurrence = "daily" | "weekdays" | "weekly" | "biweekly" | "monthly";
export type TaskGroup = "personal" | "work" | "projects" | "learning" | "health" | "finance" | "errands";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: Priority;
  group: string | null;
  dueDate: Date | null;
  completed: boolean;
  recurrence: Recurrence | null;
  createdAt: Date;
  updatedAt: Date;
}

// Habit types
export type Frequency = "daily" | "weekly";

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  frequency: Frequency;
  targetDays: number[] | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  createdAt: Date;
  updatedAt: Date;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  createdAt: Date;
}

// Expense types
export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  note: string | null;
  date: Date;
  accountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Account types
export type AccountKind =
  | "ewallet"
  | "digital_bank"
  | "bank"
  | "credit_card"
  | "cash";

export interface Account {
  id: string;
  userId: string;
  name: string;
  kind: AccountKind;
  startingBalance: number;
  emergencyOnly: boolean;
  archived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalance extends Account {
  /** All-time spending charged to this account. */
  totalSpent: number;
  /** startingBalance - totalSpent. Negative on a credit card means money owed. */
  balance: number;
}

// Recurring expense types
export interface RecurringExpense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  accountId: string | null;
  note: string | null;
  recurrence: Recurrence;
  startDate: Date;
  endDate: Date | null;
  lastRunOn: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note types
export interface Note {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  tags: string[];
  category: string | null;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mood types
export interface MoodEntry {
  id: string;
  userId: string;
  mood: number;
  energy: number | null;
  note: string | null;
  date: Date;
  createdAt: Date;
}

// Dashboard summary types
export interface DashboardSummary {
  tasksToday: number;
  tasksCompleted: number;
  activeHabits: number;
  habitsCompletedToday: number;
  expensesToday: number;
  totalExpensesToday: number;
  currentStreak: number;
  todaysMood: number | null;
}

// API response types
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Budget Goal types
export interface BudgetGoal {
  id: string;
  userId: string;
  month: Date;
  /** "overall" for a whole-month budget, otherwise an expense category value. */
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
