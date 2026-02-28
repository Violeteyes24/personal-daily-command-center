import { z } from "zod";

export const upsertBudgetGoalSchema = z.object({
  month: z.coerce.date(),
  category: z.string().max(50).optional().nullable(), // null = overall budget
  amount: z.number().positive("Budget must be positive"),
});

export type UpsertBudgetGoalInput = z.infer<typeof upsertBudgetGoalSchema>;
