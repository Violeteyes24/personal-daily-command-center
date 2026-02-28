import { getExpenses, getExpenseStats } from "@/actions/expenses";
import { ExpensesClient } from "@/components/expenses";

export default async function ExpensesPage() {
  const [expensesResult, statsResult] = await Promise.all([
    getExpenses(),
    getExpenseStats(),
  ]);

  const expenses = expensesResult.success ? expensesResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data ?? null : null;

  return <ExpensesClient initialExpenses={expenses} stats={stats} />;
}
