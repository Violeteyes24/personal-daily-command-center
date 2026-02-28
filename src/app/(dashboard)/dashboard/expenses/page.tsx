import { getExpenses, getExpenseStats } from "@/actions/expenses";
import { ExpensesClient } from "@/components/expenses";

interface ExpensesPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;

  // Parse month from search params (format: YYYY-MM) or default to current
  let targetMonth = new Date();
  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (year && month) {
      targetMonth = new Date(year, month - 1, 1);
    }
  }

  const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

  const [expensesResult, statsResult] = await Promise.all([
    getExpenses({ startDate: startOfMonth, endDate: endOfMonth }),
    getExpenseStats(targetMonth),
  ]);

  const expenses = expensesResult.success ? expensesResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data ?? null : null;

  const monthStr = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`;

  return (
    <ExpensesClient
      initialExpenses={expenses}
      stats={stats}
      currentMonth={monthStr}
    />
  );
}
