"use server";

import { db } from "@/lib/db";
import { createHabitSchema, updateHabitSchema, logHabitSchema } from "@/lib/validations/habit";
import type { ActionResponse, Habit, HabitLog } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getHabits(): Promise<ActionResponse<Habit[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const habits = await db.habit.findMany({
      where: { userId, archived: false },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 logs for streak calculation
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: habits as Habit[] };
  } catch (error) {
    console.error("Failed to get habits:", error);
    return { success: false, error: "Failed to get habits" };
  }
}

export async function createHabit(
  input: unknown
): Promise<ActionResponse<Habit>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createHabitSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const habit = await db.habit.create({
      data: {
        ...validated.data,
        userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/habits");
    return { success: true, data: habit as Habit };
  } catch (error) {
    console.error("Failed to create habit:", error);
    return { success: false, error: "Failed to create habit" };
  }
}

export async function updateHabit(
  input: unknown
): Promise<ActionResponse<Habit>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateHabitSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;

    const habit = await db.habit.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/habits");
    return { success: true, data: habit as Habit };
  } catch (error) {
    console.error("Failed to update habit:", error);
    return { success: false, error: "Failed to update habit" };
  }
}

export async function logHabit(
  input: unknown
): Promise<ActionResponse<HabitLog>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = logHabitSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Verify habit belongs to user
    const habit = await db.habit.findFirst({
      where: { id: validated.data.habitId, userId },
    });

    if (!habit) {
      return { success: false, error: "Habit not found" };
    }

    // Upsert the log (create or update for that date)
    const log = await db.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: validated.data.habitId,
          date: validated.data.date,
        },
      },
      update: { completed: validated.data.completed },
      create: {
        habitId: validated.data.habitId,
        date: validated.data.date,
        completed: validated.data.completed,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/habits");
    return { success: true, data: log as HabitLog };
  } catch (error) {
    console.error("Failed to log habit:", error);
    return { success: false, error: "Failed to log habit" };
  }
}

export async function deleteHabit(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.habit.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/habits");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete habit:", error);
    return { success: false, error: "Failed to delete habit" };
  }
}
