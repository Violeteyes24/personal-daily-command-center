"use server";

import { db } from "@/lib/db";
import {
  createRecurringExpenseSchema,
  updateRecurringExpenseSchema,
} from "@/lib/validations/recurring-expense";
import type { ActionResponse, RecurringExpense } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { today } from "@/lib/dates";
import { toAmount } from "@/lib/money";
import { occurrencesDue, type RecurrenceKind } from "@/lib/recurrence";

type RecurringRow = Prisma.RecurringExpenseGetPayload<object>;

function serialize(row: RecurringRow): RecurringExpense {
  return { ...row, amount: toAmount(row.amount) };
}

function revalidateRecurringPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

export async function getRecurringExpenses(): Promise<
  ActionResponse<RecurringExpense[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const rows = await db.recurringExpense.findMany({
      where: { userId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: rows.map(serialize) };
  } catch (error) {
    console.error("Failed to get recurring expenses:", error);
    return { success: false, error: "Failed to get recurring expenses" };
  }
}

export async function createRecurringExpense(
  input: unknown
): Promise<ActionResponse<RecurringExpense>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createRecurringExpenseSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const row = await db.recurringExpense.create({
      data: { ...validated.data, userId },
    });

    revalidateRecurringPaths();
    return { success: true, data: serialize(row) };
  } catch (error) {
    console.error("Failed to create recurring expense:", error);
    return { success: false, error: "Failed to create recurring expense" };
  }
}

export async function updateRecurringExpense(
  input: unknown
): Promise<ActionResponse<RecurringExpense>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateRecurringExpenseSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;
    if (Object.keys(data).length === 0) {
      return { success: false, error: "Nothing to update" };
    }

    const row = await db.recurringExpense.update({
      where: { id, userId },
      data,
    });

    revalidateRecurringPaths();
    return { success: true, data: serialize(row) };
  } catch (error) {
    if (isNotFound(error)) {
      return { success: false, error: "Recurring expense not found" };
    }
    console.error("Failed to update recurring expense:", error);
    return { success: false, error: "Failed to update recurring expense" };
  }
}

/**
 * Deletes the template only. Expenses it already generated are real spending
 * and stay in the log.
 */
export async function deleteRecurringExpense(
  id: string
): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { count } = await db.recurringExpense.deleteMany({
      where: { id, userId },
    });
    if (count === 0) {
      return { success: false, error: "Recurring expense not found" };
    }

    revalidateRecurringPaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete recurring expense:", error);
    return { success: false, error: "Failed to delete recurring expense" };
  }
}

/**
 * Create any Expense rows that active templates should have produced by today.
 *
 * There is no cron in this app, so this runs on page load. It is safe to call
 * repeatedly: `occurrencesDue` returns nothing once `lastRunOn` has caught up,
 * and each template's inserts plus its `lastRunOn` bump happen in one
 * transaction, so a crash mid-run cannot double-post on the next attempt.
 *
 * Returns the number of expenses created.
 */
export async function materializeDueExpenses(): Promise<ActionResponse<number>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const now = today();

    const templates = await db.recurringExpense.findMany({
      where: {
        userId,
        active: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }, { lastRunOn: null }],
      },
    });

    if (templates.length === 0) {
      return { success: true, data: 0 };
    }

    let created = 0;

    for (const template of templates) {
      const due = occurrencesDue({
        recurrence: template.recurrence as RecurrenceKind,
        startDate: template.startDate,
        endDate: template.endDate,
        lastRunOn: template.lastRunOn,
        through: now,
      });

      if (due.length === 0) continue;

      await db.$transaction(async (tx) => {
        await tx.expense.createMany({
          data: due.map((date) => ({
            userId,
            amount: template.amount,
            category: template.category,
            accountId: template.accountId,
            note: template.note,
            date,
          })),
        });

        await tx.recurringExpense.update({
          where: { id: template.id },
          data: { lastRunOn: due[due.length - 1] },
        });
      });

      created += due.length;
    }

    if (created > 0) {
      revalidateRecurringPaths();
    }

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to materialize recurring expenses:", error);
    return { success: false, error: "Failed to apply recurring expenses" };
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}
