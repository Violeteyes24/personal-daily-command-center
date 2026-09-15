"use server";

import { db } from "@/lib/db";
import {
  moveBudgetGoalSchema,
  upsertBudgetGoalSchema,
} from "@/lib/validations/budget";
import type { ActionResponse, BudgetGoal } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { monthStart } from "@/lib/dates";
import { toAmount } from "@/lib/money";
import { EXPENSE_CATEGORIES, OVERALL_BUDGET } from "@/constants/categories";

type BudgetGoalRow = Prisma.BudgetGoalGetPayload<object>;

function serialize(goal: BudgetGoalRow): BudgetGoal {
  return { ...goal, amount: toAmount(goal.amount) };
}

function revalidateBudgetPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/reports");
}

function categoryLabel(category: string): string {
  if (category === OVERALL_BUDGET) return "Overall";
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export async function getBudgetGoals(
  month: Date
): Promise<ActionResponse<BudgetGoal[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const goals = await db.budgetGoal.findMany({
      where: { userId, month: monthStart(month) },
      orderBy: { category: "asc" },
    });

    return { success: true, data: goals.map(serialize) };
  } catch (error) {
    console.error("Failed to get budget goals:", error);
    return { success: false, error: "Failed to get budget goals" };
  }
}

/**
 * Create or update the goal for a (month, category) pair.
 *
 * `category` is never null — "overall" is stored literally — so the
 * [userId, month, category] unique index does the deduplication that the old
 * nullable column could not, and a plain upsert is enough.
 */
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

    const goal = await db.budgetGoal.upsert({
      where: {
        userId_month_category: { userId, month, category },
      },
      update: { amount },
      create: { userId, month, category, amount },
    });

    revalidateBudgetPaths();
    return { success: true, data: serialize(goal) };
  } catch (error) {
    console.error("Failed to upsert budget goal:", error);
    return { success: false, error: "Failed to save budget goal" };
  }
}

/**
 * Move an existing goal to a different category.
 *
 * Previously the client upserted the new category and then deleted the old
 * row: two calls, so a failure between them left two goals, and an existing
 * goal on the target category was silently overwritten. This is one
 * transaction that refuses the collision instead.
 */
export async function moveBudgetGoal(
  input: unknown
): Promise<ActionResponse<BudgetGoal>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = moveBudgetGoalSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, category, amount } = validated.data;

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.budgetGoal.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return { error: "Budget goal not found" as const };
      }

      if (existing.category !== category) {
        const collision = await tx.budgetGoal.findUnique({
          where: {
            userId_month_category: { userId, month: existing.month, category },
          },
        });
        if (collision) {
          return {
            error: `A ${categoryLabel(category)} budget already exists for this month. Edit that goal instead.` as const,
          };
        }
      }

      const updated = await tx.budgetGoal.update({
        where: { id },
        data: { category, amount },
      });
      return { goal: updated };
    });

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    revalidateBudgetPaths();
    return { success: true, data: serialize(result.goal) };
  } catch (error) {
    console.error("Failed to move budget goal:", error);
    return { success: false, error: "Failed to save budget goal" };
  }
}

export async function deleteBudgetGoal(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { count } = await db.budgetGoal.deleteMany({ where: { id, userId } });
    if (count === 0) {
      return { success: false, error: "Budget goal not found" };
    }

    revalidateBudgetPaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete budget goal:", error);
    return { success: false, error: "Failed to delete budget goal" };
  }
}
