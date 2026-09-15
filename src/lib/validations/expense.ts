import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { toCalendarDate } from "@/lib/dates";
import { roundAmount } from "@/lib/money";

const categoryValues = EXPENSE_CATEGORIES.map((c) => c.value) as [string, ...string[]];

// Expense validation schemas
export const createExpenseSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(100_000_000, "Amount is too large")
    // Stored as Decimal(12,2) — round here so what is validated is what is stored.
    .transform(roundAmount),
  category: z.enum(categoryValues),
  note: z.string().max(500, "Note is too long").optional(),
  // Pin to a calendar day so the stored date is the day the user picked,
  // whatever timezone the server runs in.
  date: z.coerce.date().transform(toCalendarDate),
  // Which wallet/bank paid. Null is allowed — attribution is optional.
  accountId: z.string().min(1).nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().min(1, "Expense id is required"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
