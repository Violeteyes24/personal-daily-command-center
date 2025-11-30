"use server";

import { db } from "@/lib/db";
import { createMoodSchema, updateMoodSchema } from "@/lib/validations/mood";
import type { ActionResponse, MoodEntry } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getMoodEntries(
  options?: { startDate?: Date; endDate?: Date }
): Promise<ActionResponse<MoodEntry[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const where: Record<string, unknown> = { userId };

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options.startDate) {
        (where.date as Record<string, Date>).gte = options.startDate;
      }
      if (options.endDate) {
        (where.date as Record<string, Date>).lte = options.endDate;
      }
    }

    const entries = await db.moodEntry.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return { success: true, data: entries as MoodEntry[] };
  } catch (error) {
    console.error("Failed to get mood entries:", error);
    return { success: false, error: "Failed to get mood entries" };
  }
}

export async function getTodayMood(): Promise<ActionResponse<MoodEntry | null>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await db.moodEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return { success: true, data: entry as MoodEntry | null };
  } catch (error) {
    console.error("Failed to get today's mood:", error);
    return { success: false, error: "Failed to get today's mood" };
  }
}

export async function createOrUpdateMood(
  input: unknown
): Promise<ActionResponse<MoodEntry>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createMoodSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const date = new Date(validated.data.date);
    date.setHours(0, 0, 0, 0);

    // Upsert: one mood entry per day
    const entry = await db.moodEntry.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        mood: validated.data.mood,
        energy: validated.data.energy,
        note: validated.data.note,
      },
      create: {
        userId,
        mood: validated.data.mood,
        energy: validated.data.energy,
        note: validated.data.note,
        date,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/mood");
    return { success: true, data: entry as MoodEntry };
  } catch (error) {
    console.error("Failed to create/update mood:", error);
    return { success: false, error: "Failed to save mood entry" };
  }
}

export async function updateMood(
  input: unknown
): Promise<ActionResponse<MoodEntry>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateMoodSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;

    const entry = await db.moodEntry.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/mood");
    return { success: true, data: entry as MoodEntry };
  } catch (error) {
    console.error("Failed to update mood:", error);
    return { success: false, error: "Failed to update mood entry" };
  }
}

export async function deleteMood(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.moodEntry.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/mood");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete mood:", error);
    return { success: false, error: "Failed to delete mood entry" };
  }
}
