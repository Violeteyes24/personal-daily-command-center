import { z } from "zod";

// Mood entry validation schemas
export const createMoodSchema = z.object({
  mood: z.coerce.number().min(1).max(5), // 1 = terrible, 5 = great
  energy: z.coerce.number().min(1).max(5).optional(),
  note: z.string().max(1000, "Note is too long").optional(),
  date: z.coerce.date().default(() => new Date()),
});

export const updateMoodSchema = createMoodSchema.partial().extend({
  id: z.string(),
});

export type CreateMoodInput = z.infer<typeof createMoodSchema>;
export type UpdateMoodInput = z.infer<typeof updateMoodSchema>;
