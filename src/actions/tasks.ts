"use server";

import { db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";
import type { ActionResponse, Task } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getTasks(): Promise<ActionResponse<Task[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const tasks = await db.task.findMany({
      where: { userId },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, data: tasks as Task[] };
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return { success: false, error: "Failed to get tasks" };
  }
}

export async function getTodayTasks(): Promise<ActionResponse<Task[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await db.task.findMany({
      where: {
        userId,
        OR: [
          { dueDate: { gte: today, lt: tomorrow } },
          { dueDate: null, completed: false },
        ],
      },
      orderBy: [{ completed: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: tasks as Task[] };
  } catch (error) {
    console.error("Failed to get today tasks:", error);
    return { success: false, error: "Failed to get today tasks" };
  }
}

export async function createTask(
  input: unknown
): Promise<ActionResponse<Task>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createTaskSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const task = await db.task.create({
      data: {
        ...validated.data,
        userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true, data: task as Task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(
  input: unknown
): Promise<ActionResponse<Task>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateTaskSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;

    const task = await db.task.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true, data: task as Task };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function toggleTask(id: string): Promise<ActionResponse<Task>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.task.findUnique({
      where: { id, userId },
    });

    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    const task = await db.task.update({
      where: { id, userId },
      data: { completed: !existing.completed },
    });

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true, data: task as Task };
  } catch (error) {
    console.error("Failed to toggle task:", error);
    return { success: false, error: "Failed to toggle task" };
  }
}

export async function deleteTask(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.task.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task" };
  }
}
