import { z } from "zod";

// Habit validation schemas
export const createHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  icon: z.string().max(10).optional(),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  targetDays: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  id: z.string(),
});

export const logHabitSchema = z.object({
  habitId: z.string(),
  date: z.coerce.date(),
  completed: z.boolean(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogHabitInput = z.infer<typeof logHabitSchema>;
