import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { toCalendarDate } from "@/lib/dates";
import { roundAmount } from "@/lib/money";
import type { Recurrence } from "@/types";

const categoryValues = EXPENSE_CATEGORIES.map((c) => c.value) as [
  string,
  ...string[],
];

const recurrenceValues: [Recurrence, ...Recurrence[]] = [
  "daily",
  "weekdays",
  "weekly",
  "biweekly",
  "monthly",
];

export const createRecurringExpenseSchema = z
  .object({
    amount: z.coerce
      .number()
      .positive("Amount must be positive")
      .max(100_000_000, "Amount is too large")
      .transform(roundAmount),
    category: z.enum(categoryValues),
    accountId: z.string().min(1).nullable().optional(),
    note: z.string().max(500, "Note is too long").optional(),
    recurrence: z.enum(recurrenceValues),
    startDate: z.coerce.date().transform(toCalendarDate),
    endDate: z.coerce.date().transform(toCalendarDate).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) => !value.endDate || value.endDate.getTime() >= value.startDate.getTime(),
    { message: "End date must be on or after the start date", path: ["endDate"] }
  );

export const updateRecurringExpenseSchema = z.object({
  id: z.string().min(1, "Recurring expense id is required"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(100_000_000, "Amount is too large")
    .transform(roundAmount)
    .optional(),
  category: z.enum(categoryValues).optional(),
  accountId: z.string().min(1).nullable().optional(),
  note: z.string().max(500, "Note is too long").optional(),
  recurrence: z.enum(recurrenceValues).optional(),
  endDate: z.coerce.date().transform(toCalendarDate).nullable().optional(),
  active: z.boolean().optional(),
});

export type CreateRecurringExpenseInput = z.infer<
  typeof createRecurringExpenseSchema
>;
export type UpdateRecurringExpenseInput = z.infer<
  typeof updateRecurringExpenseSchema
>;
