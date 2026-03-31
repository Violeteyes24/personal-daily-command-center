"use server";

import { db } from "@/lib/db";
import { upsertBudgetGoalSchema } from "@/lib/validations/budget";
import type { ActionResponse, BudgetGoal } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function toMonthStart(month: Date): Date {
  return new Date(month.getFullYear(), month.getMonth(), 1);
}

function revalidateBudgetPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

export async function getBudgetGoals(
  month: Date
): Promise<ActionResponse<BudgetGoal[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const startOfMonth = toMonthStart(month);

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
    const startOfMonth = toMonthStart(month);

    // Handle overall budgets separately because nullable fields in unique constraints
    // can still allow duplicates depending on database semantics.
    const goal =
      category === null
        ? await db.$transaction(async (tx) => {
            const overallGoals = await tx.budgetGoal.findMany({
              where: {
                userId,
                month: startOfMonth,
                category: null,
              },
              orderBy: { createdAt: "asc" },
            });

            if (overallGoals.length === 0) {
              return tx.budgetGoal.create({
                data: {
                  userId,
                  month: startOfMonth,
                  category: null,
                  amount,
                },
              });
            }

            const primaryGoal = overallGoals[0];
            const updatedGoal = await tx.budgetGoal.update({
              where: { id: primaryGoal.id },
              data: { amount },
            });

            if (overallGoals.length > 1) {
              await tx.budgetGoal.deleteMany({
                where: {
                  userId,
                  month: startOfMonth,
                  category: null,
                  id: { not: primaryGoal.id },
                },
              });
            }

            return updatedGoal;
          })
        : await db.budgetGoal.upsert({
            where: {
              userId_month_category: {
                userId,
                month: startOfMonth,
                category,
              },
            },
            update: { amount },
            create: {
              userId,
              month: startOfMonth,
              category,
              amount,
            },
          });

    revalidateBudgetPaths();
    return { success: true, data: goal as BudgetGoal };
  } catch (error) {
    console.error("Failed to upsert budget goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save budget goal",
    };
  }
}

export async function deleteBudgetGoal(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existingGoal = await db.budgetGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || existingGoal.userId !== userId) {
      return { success: false, error: "Budget goal not found" };
    }

    await db.budgetGoal.delete({
      where: { id },
    });

    revalidateBudgetPaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete budget goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete budget goal",
    };
  }
}
