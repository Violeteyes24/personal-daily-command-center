"use server";

import { db } from "@/lib/db";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations/expense";
import type { ActionResponse, Expense } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getExpenses(
  options?: { startDate?: Date; endDate?: Date; category?: string }
): Promise<ActionResponse<Expense[]>> {
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

    if (options?.category) {
      where.category = options.category;
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return { success: true, data: expenses as Expense[] };
  } catch (error) {
    console.error("Failed to get expenses:", error);
    return { success: false, error: "Failed to get expenses" };
  }
}

export async function getTodayExpenses(): Promise<ActionResponse<Expense[]>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getExpenses({ startDate: today, endDate: tomorrow });
}

export async function createExpense(
  input: unknown
): Promise<ActionResponse<Expense>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createExpenseSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const expense = await db.expense.create({
      data: {
        ...validated.data,
        userId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return { success: true, data: expense as Expense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

export async function updateExpense(
  input: unknown
): Promise<ActionResponse<Expense>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateExpenseSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;

    const expense = await db.expense.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return { success: true, data: expense as Expense };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.expense.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpenseStats(month?: Date): Promise<
  ActionResponse<{
    total: number;
    byCategory: { category: string; total: number }[];
  }>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const targetMonth = month || new Date();
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    const expenses = await db.expense.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    let total = 0;
    const categoryMap = new Map<string, number>();

    for (const exp of expenses) {
      total += exp.amount;
      const current = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, current + exp.amount);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, categoryTotal]) => ({
      category,
      total: categoryTotal,
    }));

    return { success: true, data: { total, byCategory } };
  } catch (error) {
    console.error("Failed to get expense stats:", error);
    return { success: false, error: "Failed to get expense stats" };
  }
}
