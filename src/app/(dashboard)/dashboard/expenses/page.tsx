import { getExpenses, getExpenseStats } from "@/actions/expenses";
import { getBudgetGoals } from "@/actions/budget";
import { ensureDefaultAccounts, getAccountBalances } from "@/actions/accounts";
import {
  getRecurringExpenses,
  materializeDueExpenses,
} from "@/actions/recurring-expenses";
import { ExpensesClient } from "@/components/expenses";
import {
  formatMonthParam,
  monthOf,
  monthRange,
  parseMonthParam,
  today,
} from "@/lib/dates";

interface ExpensesPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;

  // parseMonthParam ignores today's date entirely. The previous
  // parse(param, "yyyy-MM", new Date()) inherited today's day-of-month and
  // overflowed on the 29th-31st, making short months unreachable.
  const { year, month } = parseMonthParam(params.month) ?? monthOf(today());

  // Inclusive first..last day of the month. The old new Date(y, m + 1, 0)
  // resolved to the 29th in UTC+8, silently dropping the final day.
  const { start, end } = monthRange(year, month);
  const monthAnchor = start;

  // There is no cron, so due recurring expenses are created on page load.
  // Both calls are idempotent and cheap once they have run.
  await Promise.all([ensureDefaultAccounts(), materializeDueExpenses()]);

  const [expensesResult, statsResult, budgetResult, balancesResult, recurringResult] =
    await Promise.all([
      getExpenses({ startDate: start, endDate: end }),
      getExpenseStats(monthAnchor),
      getBudgetGoals(monthAnchor),
      getAccountBalances(),
      getRecurringExpenses(),
    ]);

  const expenses = expensesResult.success ? (expensesResult.data ?? []) : [];
  const stats = statsResult.success ? (statsResult.data ?? null) : null;
  const budgetGoals = budgetResult.success ? (budgetResult.data ?? []) : [];
  const budgetLoadFailed = !budgetResult.success;
  const accountData = balancesResult.success ? balancesResult.data : undefined;
  const recurring = recurringResult.success ? (recurringResult.data ?? []) : [];

  return (
    <ExpensesClient
      initialExpenses={expenses}
      stats={stats}
      currentMonth={formatMonthParam(year, month)}
      budgetGoals={budgetGoals}
      budgetLoadFailed={budgetLoadFailed}
      accountBalances={accountData?.balances ?? []}
      totalAvailable={accountData?.totalAvailable ?? 0}
      totalOwed={accountData?.totalOwed ?? 0}
      recurring={recurring}
    />
  );
}
