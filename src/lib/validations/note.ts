import { z } from "zod";

// Note validation schemas
export const createNoteSchema = z.object({
  title: z.string().max(200, "Title is too long").optional(),
  content: z.string().min(1, "Content is required").max(10000, "Content is too long"),
  tags: z.array(z.string().max(50)).max(10, "Too many tags").optional(),
  pinned: z.boolean().default(false),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  id: z.string(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
