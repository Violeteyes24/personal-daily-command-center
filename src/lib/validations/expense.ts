import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/constants/categories";

const categoryValues = EXPENSE_CATEGORIES.map((c) => c.value) as [string, ...string[]];

// Expense validation schemas
export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.enum(categoryValues),
  note: z.string().max(500, "Note is too long").optional(),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
