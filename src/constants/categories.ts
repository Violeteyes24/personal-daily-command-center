export const EXPENSE_CATEGORIES = [
  { value: "food", label: "Food & Dining", icon: "🍔" },
  { value: "transport", label: "Transportation", icon: "🚗" },
  { value: "shopping", label: "Shopping", icon: "🛒" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "bills", label: "Bills & Utilities", icon: "💡" },
  { value: "health", label: "Health & Medical", icon: "💊" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "personal", label: "Personal Care", icon: "💅" },
  { value: "gifts", label: "Gifts & Donations", icon: "🎁" },
  { value: "savings", label: "Savings", icon: "💰" },
  { value: "other", label: "Other", icon: "📦" },
] as const;

/**
 * Sentinel category for a whole-month budget goal.
 * Stored literally in BudgetGoal.category so the unique index can enforce
 * one goal per category per month (a NULL would not be deduplicated).
 */
export const OVERALL_BUDGET = "overall";

/** Select-item value meaning "no account chosen" (Radix forbids ""). */
export const NO_ACCOUNT = "none";

export const ACCOUNT_KINDS = [
  { value: "ewallet", label: "E-wallet", icon: "📱" },
  { value: "digital_bank", label: "Digital Bank", icon: "🏦" },
  { value: "bank", label: "Bank", icon: "🏛️" },
  { value: "credit_card", label: "Credit Card", icon: "💳" },
  { value: "cash", label: "Cash", icon: "💵" },
] as const;

/**
 * Seeded once per user on first visit. Mirrors the accounts actually in use;
 * everything here is editable afterwards.
 */
export const DEFAULT_ACCOUNTS = [
  { name: "GCash", kind: "ewallet", emergencyOnly: true },
  { name: "Maya", kind: "ewallet", emergencyOnly: false },
  { name: "Maribank", kind: "digital_bank", emergencyOnly: false },
  { name: "Tonik", kind: "digital_bank", emergencyOnly: false },
  { name: "GoTyme", kind: "digital_bank", emergencyOnly: false },
  { name: "BPI Savings", kind: "bank", emergencyOnly: false },
  { name: "BPI Credit Card", kind: "credit_card", emergencyOnly: false },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "Low", color: "bg-slate-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
] as const;

export const TASK_GROUPS = [
  { value: "personal", label: "Personal", icon: "👤", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "work", label: "Work", icon: "💼", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "projects", label: "Projects", icon: "🚀", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "learning", label: "Learning", icon: "📚", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "health", label: "Health", icon: "💪", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { value: "finance", label: "Finance", icon: "💰", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "errands", label: "Errands", icon: "🏃", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
] as const;

export const MOOD_LEVELS = [
  { value: 1, label: "Terrible", emoji: "😢" },
  { value: 2, label: "Bad", emoji: "😕" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😄" },
] as const;

export const ENERGY_LEVELS = [
  { value: 1, label: "Exhausted", emoji: "🪫" },
  { value: 2, label: "Tired", emoji: "😴" },
  { value: 3, label: "Normal", emoji: "⚡" },
  { value: 4, label: "Energetic", emoji: "💪" },
  { value: 5, label: "Supercharged", emoji: "🚀" },
] as const;

export const TASK_RECURRENCES = [
  { value: "daily", label: "Daily", icon: "📅" },
  { value: "weekdays", label: "Weekdays", icon: "🏢" },
  { value: "weekly", label: "Weekly", icon: "📆" },
  { value: "biweekly", label: "Every 2 Weeks", icon: "🔄" },
  { value: "monthly", label: "Monthly", icon: "🗓️" },
] as const;

export const DEFAULT_HABIT_ICONS = [
  "💧", // Water
  "🏃", // Exercise
  "📖", // Reading
  "🧘", // Meditation
  "💤", // Sleep
  "🥗", // Healthy eating
  "💊", // Vitamins
  "📝", // Journal
  "🎸", // Practice instrument
  "🌐", // Learn language
] as const;

export const NOTE_CATEGORIES = [
  { value: "general", label: "General", icon: "📝" },
  { value: "work", label: "Work", icon: "💼" },
  { value: "personal", label: "Personal", icon: "👤" },
  { value: "ideas", label: "Ideas", icon: "💡" },
  { value: "journal", label: "Journal", icon: "📓" },
  { value: "meeting", label: "Meeting Notes", icon: "🤝" },
  { value: "reference", label: "Reference", icon: "📚" },
  { value: "recipes", label: "Recipes", icon: "🍳" },
] as const;
