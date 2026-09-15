import { EXPENSE_CATEGORIES, OVERALL_BUDGET } from "@/constants/categories";
import { z } from "zod";
import { monthStart } from "@/lib/dates";
import { roundAmount } from "@/lib/money";

// Leading literal keeps this a valid non-empty tuple for z.enum.
const budgetCategoryValues: [string, ...string[]] = [
  OVERALL_BUDGET,
  ...EXPENSE_CATEGORIES.map((category) => category.value),
];

export const upsertBudgetGoalSchema = z.object({
  // First of the month as a calendar date, matching the @db.Date column.
  month: z.coerce.date().transform(monthStart),
  // Accepts null/undefined for backwards compatibility with existing callers,
  // but always normalises to the "overall" sentinel that the column stores.
  category: z
    .enum(budgetCategoryValues)
    .optional()
    .nullable()
    .transform((value) => value ?? OVERALL_BUDGET),
  amount: z.coerce
    .number()
    .positive("Budget must be positive")
    .max(1_000_000, "Budget is too large")
    .transform(roundAmount),
});

/** Move an existing goal to a different category (and optionally change amount). */
export const moveBudgetGoalSchema = z.object({
  id: z.string().min(1, "Budget goal id is required"),
  category: z.enum(budgetCategoryValues),
  amount: z.coerce
    .number()
    .positive("Budget must be positive")
    .max(1_000_000, "Budget is too large")
    .transform(roundAmount),
});

export type UpsertBudgetGoalInput = z.infer<typeof upsertBudgetGoalSchema>;
export type MoveBudgetGoalInput = z.infer<typeof moveBudgetGoalSchema>;
