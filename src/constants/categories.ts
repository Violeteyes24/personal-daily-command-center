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

export const TASK_PRIORITIES = [
  { value: "low", label: "Low", color: "bg-slate-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
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
