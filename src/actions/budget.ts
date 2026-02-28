"use server";

import { db } from "@/lib/db";
import { upsertBudgetGoalSchema } from "@/lib/validations/budget";
import type { ActionResponse, BudgetGoal } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getBudgetGoals(
  month: Date
): Promise<ActionResponse<BudgetGoal[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    const goals = await db.budgetGoal.findMany({
      where: { userId, month: startOfMonth },
      orderBy: { category: "asc" },
    });

    return { success: true, data: goals as BudgetGoal[] };
  } catch (error) {
    console.error("Failed to get budget goals:", error);
    return { success: false, error: "Failed to get budget goals" };
  }
}

export async function upsertBudgetGoal(
  input: unknown
): Promise<ActionResponse<BudgetGoal>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = upsertBudgetGoalSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { month, category, amount } = validated.data;
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const categoryKey = category ?? "overall";

    const goal = await db.budgetGoal.upsert({
      where: {
        userId_month_category: {
          userId,
          month: startOfMonth,
          category: categoryKey === "overall" ? null! : categoryKey,
        },
      },
      update: { amount },
      create: {
        userId,
        month: startOfMonth,
        category: categoryKey === "overall" ? null : categoryKey,
        amount,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return { success: true, data: goal as BudgetGoal };
  } catch (error) {
    console.error("Failed to upsert budget goal:", error);
    return { success: false, error: "Failed to save budget goal" };
  }
}

export async function deleteBudgetGoal(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.budgetGoal.delete({
      where: { id, userId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete budget goal:", error);
    return { success: false, error: "Failed to delete budget goal" };
  }
}
