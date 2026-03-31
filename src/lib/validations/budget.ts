import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { z } from "zod";

const budgetCategoryValues = [
  ...EXPENSE_CATEGORIES.map((category) => category.value),
  "overall",
] as [string, ...string[]];

export const upsertBudgetGoalSchema = z.object({
  month: z
    .coerce.date()
    .transform((month) => new Date(month.getFullYear(), month.getMonth(), 1)),
  category: z
    .enum(budgetCategoryValues)
    .optional()
    .nullable()
    .transform((value) => (value === "overall" || value == null ? null : value)),
  amount: z
    .coerce.number()
    .positive("Budget must be positive")
    .max(1_000_000, "Budget is too large"),
});

export type UpsertBudgetGoalInput = z.infer<typeof upsertBudgetGoalSchema>;
