"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import type { ActionResponse } from "@/types";

export interface ReportData {
  period: string;
  periodLabel: string;

  // Tasks
  tasksCreated: number;
  tasksCompleted: number;
  taskCompletionRate: number;

  // Habits
  habitTotalChecks: number;
  habitPossibleChecks: number;
  habitConsistencyRate: number;
  topHabits: { name: string; icon: string | null; completed: number; total: number }[];

  // Expenses
  totalSpent: number;
  expenseCount: number;
  topCategories: { category: string; total: number }[];
  previousPeriodSpent: number;
  spendingChange: number; // percentage

  // Mood
  avgMood: number | null;
  avgEnergy: number | null;
  moodEntries: number;

  // Daily data for charts
  dailyTasks: { date: string; completed: number; created: number }[];
  dailyExpenses: { date: string; total: number }[];
  dailyMood: { date: string; mood: number; energy: number | null }[];
}

export async function getReport(
  type: "weekly" | "monthly",
  date: Date
): Promise<ActionResponse<ReportData>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const start = type === "weekly" ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date);
    const end = type === "weekly" ? endOfWeek(date, { weekStartsOn: 1 }) : endOfMonth(date);
    const prevStart = type === "weekly" ? startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 }) : startOfMonth(subMonths(date, 1));
    const prevEnd = type === "weekly" ? endOfWeek(subWeeks(date, 1), { weekStartsOn: 1 }) : endOfMonth(subMonths(date, 1));

    const periodLabel = type === "weekly"
      ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
      : format(start, "MMMM yyyy");

    // Fetch all data in parallel
    const [tasks, prevTasks, habits, expenses, prevExpenses, moods] = await Promise.all([
      db.task.findMany({
        where: { userId, createdAt: { gte: start, lte: end } },
      }),
      db.task.findMany({
        where: { userId, createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      db.habit.findMany({
        where: { userId, archived: false },
        include: {
          logs: {
            where: { date: { gte: start, lte: end } },
          },
        },
      }),
      db.expense.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      }),
      db.expense.findMany({
        where: { userId, date: { gte: prevStart, lte: prevEnd } },
      }),
      db.moodEntry.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      }),
    ]);

    // Tasks stats
    const tasksCreated = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.completed).length;
    const taskCompletionRate = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

    // Habits stats
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const habitPossibleChecks = habits.length * daysInPeriod;
    const habitTotalChecks = habits.reduce((sum, h) => sum + h.logs.filter((l) => l.completed).length, 0);
    const habitConsistencyRate = habitPossibleChecks > 0 ? Math.round((habitTotalChecks / habitPossibleChecks) * 100) : 0;

    const topHabits = habits
      .map((h) => ({
        name: h.name,
        icon: h.icon,
        completed: h.logs.filter((l) => l.completed).length,
        total: daysInPeriod,
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);

    // Expenses stats
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const previousPeriodSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const spendingChange = previousPeriodSpent > 0
      ? Math.round(((totalSpent - previousPeriodSpent) / previousPeriodSpent) * 100)
      : 0;

    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    }
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Mood stats
    const moodEntries = moods.length;
    const avgMood = moodEntries > 0 ? Math.round((moods.reduce((s, m) => s + m.mood, 0) / moodEntries) * 10) / 10 : null;
    const moodsWithEnergy = moods.filter((m) => m.energy !== null);
    const avgEnergy = moodsWithEnergy.length > 0
      ? Math.round((moodsWithEnergy.reduce((s, m) => s + (m.energy ?? 0), 0) / moodsWithEnergy.length) * 10) / 10
      : null;

    // Daily aggregates for charts
    const dayMap = new Map<string, { tasksCompleted: number; tasksCreated: number; expenses: number }>();
    for (const t of tasks) {
      const key = format(new Date(t.createdAt), "yyyy-MM-dd");
      const d = dayMap.get(key) || { tasksCompleted: 0, tasksCreated: 0, expenses: 0 };
      d.tasksCreated++;
      if (t.completed) d.tasksCompleted++;
      dayMap.set(key, d);
    }
    for (const e of expenses) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      const d = dayMap.get(key) || { tasksCompleted: 0, tasksCreated: 0, expenses: 0 };
      d.expenses += e.amount;
      dayMap.set(key, d);
    }

    const dailyTasks = Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, completed: v.tasksCompleted, created: v.tasksCreated }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dailyExpenses = expenses.reduce<Record<string, number>>((acc, e) => {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      acc[key] = (acc[key] || 0) + e.amount;
      return acc;
    }, {});
    const dailyExpensesArr = Object.entries(dailyExpenses)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dailyMood = moods.map((m) => ({
      date: format(new Date(m.date), "yyyy-MM-dd"),
      mood: m.mood,
      energy: m.energy,
    }));

    return {
      success: true,
      data: {
        period: type,
        periodLabel,
        tasksCreated,
        tasksCompleted,
        taskCompletionRate,
        habitTotalChecks,
        habitPossibleChecks,
        habitConsistencyRate,
        topHabits,
        totalSpent,
        expenseCount: expenses.length,
        topCategories,
        previousPeriodSpent,
        spendingChange,
        avgMood,
        avgEnergy,
        moodEntries,
        dailyTasks,
        dailyExpenses: dailyExpensesArr,
        dailyMood,
      },
    };
  } catch (error) {
    console.error("Failed to get report:", error);
    return { success: false, error: "Failed to get report" };
  }
}
