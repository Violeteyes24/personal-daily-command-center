"use server";

import { db } from "@/lib/db";
import { createNoteSchema, updateNoteSchema } from "@/lib/validations/note";
import type { ActionResponse, Note } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getNotes(): Promise<ActionResponse<Note[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const notes = await db.note.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    return { success: true, data: notes as Note[] };
  } catch (error) {
    console.error("Failed to get notes:", error);
    return { success: false, error: "Failed to get notes" };
  }
}

export async function getNotesByTag(tag: string): Promise<ActionResponse<Note[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const notes = await db.note.findMany({
      where: {
        userId,
        tags: { has: tag },
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    return { success: true, data: notes as Note[] };
  } catch (error) {
    console.error("Failed to get notes by tag:", error);
    return { success: false, error: "Failed to get notes" };
  }
}

export async function createNote(
  input: unknown
): Promise<ActionResponse<Note>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createNoteSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const note = await db.note.create({
      data: {
        ...validated.data,
        userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true, data: note as Note };
  } catch (error) {
    console.error("Failed to create note:", error);
    return { success: false, error: "Failed to create note" };
  }
}

export async function updateNote(
  input: unknown
): Promise<ActionResponse<Note>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateNoteSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;

    const note = await db.note.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true, data: note as Note };
  } catch (error) {
    console.error("Failed to update note:", error);
    return { success: false, error: "Failed to update note" };
  }
}

export async function toggleNotePin(id: string): Promise<ActionResponse<Note>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.note.findUnique({
      where: { id, userId },
    });

    if (!existing) {
      return { success: false, error: "Note not found" };
    }

    const note = await db.note.update({
      where: { id, userId },
      data: { pinned: !existing.pinned },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true, data: note as Note };
  } catch (error) {
    console.error("Failed to toggle note pin:", error);
    return { success: false, error: "Failed to toggle note pin" };
  }
}

export async function deleteNote(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.note.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false, error: "Failed to delete note" };
  }
}
