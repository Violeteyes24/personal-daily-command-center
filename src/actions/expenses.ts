"use server";

import { db } from "@/lib/db";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations/expense";
import type { ActionResponse, Expense } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import {
  addMonthsClamped,
  dayRange,
  formatCalendarDate,
  monthOf,
  monthRange,
  today,
} from "@/lib/dates";
import { subtractAmounts, sumBy, toAmount } from "@/lib/money";

/**
 * Prisma returns Decimal objects for money columns. Convert at the action
 * boundary so client components keep receiving plain numbers.
 */
type ExpenseRow = Prisma.ExpenseGetPayload<object>;

function serialize(expense: ExpenseRow): Expense {
  return { ...expense, amount: toAmount(expense.amount) };
}

function revalidateExpensePaths() {
  revalidatePath("/dashboard");
  // The route is /dashboard/expenses — "/expenses" does not exist and was a no-op.
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/reports");
}

export async function getExpenses(
  options?: { startDate?: Date; endDate?: Date; category?: string }
): Promise<ActionResponse<Expense[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const where: Prisma.ExpenseWhereInput = { userId };

    if (options?.startDate || options?.endDate) {
      where.date = {
        ...(options.startDate ? { gte: options.startDate } : {}),
        ...(options.endDate ? { lte: options.endDate } : {}),
      };
    }

    if (options?.category) {
      where.category = options.category;
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: expenses.map(serialize) };
  } catch (error) {
    console.error("Failed to get expenses:", error);
    return { success: false, error: "Failed to get expenses" };
  }
}

export async function getTodayExpenses(): Promise<ActionResponse<Expense[]>> {
  // dayRange covers a single calendar day. The previous version ran
  // gte today / lte tomorrow, counting tomorrow's expenses as today's.
  const { start, end } = dayRange(today());
  return getExpenses({ startDate: start, endDate: end });
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

    revalidateExpensePaths();
    return { success: true, data: serialize(expense) };
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

    if (Object.keys(data).length === 0) {
      return { success: false, error: "Nothing to update" };
    }

    // userId in the filter scopes the update to the owner; a mismatch raises
    // P2025 rather than silently editing another user's row.
    const expense = await db.expense.update({
      where: { id, userId },
      data,
    });

    revalidateExpensePaths();
    return { success: true, data: serialize(expense) };
  } catch (error) {
    if (isNotFound(error)) {
      return { success: false, error: "Expense not found" };
    }
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

    revalidateExpensePaths();
    return { success: true };
  } catch (error) {
    if (isNotFound(error)) {
      return { success: false, error: "Expense not found" };
    }
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export interface ExpenseStats {
  total: number;
  count: number;
  byCategory: { category: string; total: number }[];
  /** Per-day totals for the month, ascending. Days with no spending are omitted. */
  dailyTotals: { date: string; total: number }[];
  previousMonthTotal: number;
  /** Percentage change vs the previous month; null when there is no baseline. */
  spendingChange: number | null;
  averagePerDay: number;
}

export async function getExpenseStats(
  month?: Date
): Promise<ActionResponse<ExpenseStats>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { year, month: monthNumber } = monthOf(month ?? today());
    const current = monthRange(year, monthNumber);
    const previousMonth = monthOf(addMonthsClamped(current.start, -1));
    const previous = monthRange(previousMonth.year, previousMonth.month);

    const [expenses, previousExpenses] = await Promise.all([
      db.expense.findMany({
        where: { userId, date: { gte: current.start, lte: current.end } },
        orderBy: { date: "asc" },
      }),
      db.expense.findMany({
        where: { userId, date: { gte: previous.start, lte: previous.end } },
        select: { amount: true },
      }),
    ]);

    const total = sumBy(expenses, (e) => e.amount);
    const previousMonthTotal = sumBy(previousExpenses, (e) => e.amount);

    // Accumulate in centavos so repeated addition stays exact.
    const categoryCentavos = new Map<string, number>();
    const dailyCentavos = new Map<string, number>();

    for (const expense of expenses) {
      const centavos = Math.round(toAmount(expense.amount) * 100);
      categoryCentavos.set(
        expense.category,
        (categoryCentavos.get(expense.category) ?? 0) + centavos
      );
      const day = formatCalendarDate(expense.date);
      dailyCentavos.set(day, (dailyCentavos.get(day) ?? 0) + centavos);
    }

    const byCategory = Array.from(categoryCentavos.entries())
      .map(([category, centavos]) => ({ category, total: centavos / 100 }))
      .sort((a, b) => b.total - a.total);

    const dailyTotals = Array.from(dailyCentavos.entries())
      .map(([date, centavos]) => ({ date, total: centavos / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const daysInMonth = current.end.getUTCDate();

    return {
      success: true,
      data: {
        total,
        count: expenses.length,
        byCategory,
        dailyTotals,
        previousMonthTotal,
        spendingChange:
          previousMonthTotal > 0
            ? Math.round(
                (subtractAmounts(total, previousMonthTotal) / previousMonthTotal) * 100
              )
            : null,
        averagePerDay:
          daysInMonth > 0 ? Math.round((total / daysInMonth) * 100) / 100 : 0,
      },
    };
  } catch (error) {
    console.error("Failed to get expense stats:", error);
    return { success: false, error: "Failed to get expense stats" };
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
