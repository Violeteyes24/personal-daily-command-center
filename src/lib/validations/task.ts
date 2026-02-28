import { z } from "zod";

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  priority: z.enum(["low", "medium", "high"]),
  group: z.string().max(50).optional().nullable(),
  dueDate: z.date().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
