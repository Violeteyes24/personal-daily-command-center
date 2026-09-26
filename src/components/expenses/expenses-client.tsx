"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet, X, Filter, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseForm } from "./expense-form";
import { ExpenseCard } from "./expense-card";
import { ExpensePieChart } from "./expense-pie-chart";
import { AccountBalances } from "./account-balances";
import { SpendingTrend } from "./spending-trend";
import { RecurringExpenses } from "./recurring-expenses";
import { BudgetGoalForm } from "./budget-goal-form";
import { BudgetProgress } from "./budget-progress";
import { ConfirmDialog, EmptyState } from "@/components/shared";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import type { ExpenseStats } from "@/actions/expenses";
import {
  deleteBudgetGoal,
  moveBudgetGoal,
  upsertBudgetGoal,
} from "@/actions/budget";
import { cn, formatCurrency } from "@/lib/utils";
import { sumBy } from "@/lib/money";
import {
  addMonthsClamped,
  formatMonthParam,
  monthOf,
  monthRange,
  parseMonthParam,
  today,
} from "@/lib/dates";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import type {
  AccountBalance,
  BudgetGoal,
  Expense,
  RecurringExpense,
} from "@/types";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/lib/validations/expense";

// ==========================================
// Types
// ==========================================
interface ExpensesClientProps {
  initialExpenses: Expense[];
  stats: ExpenseStats | null;
  currentMonth: string; // "YYYY-MM"
  budgetGoals: BudgetGoal[];
  budgetLoadFailed?: boolean;
  accountBalances: AccountBalance[];
  totalAvailable: number;
  totalOwed: number;
  recurring: RecurringExpense[];
}

type CategoryFilter = "all" | string;

// ==========================================
// Component
// ==========================================
export function ExpensesClient({
  initialExpenses,
  stats,
  currentMonth,
  budgetGoals,
  budgetLoadFailed = false,
  accountBalances,
  totalAvailable,
  totalOwed,
  recurring,
}: ExpensesClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Budget form state
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  // ==========================================
  // Filtered Expenses
  // ==========================================
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter(
      (e) =>
        (categoryFilter === "all" || e.category === categoryFilter) &&
        (accountFilter === "all" || e.accountId === accountFilter)
    );
  }, [initialExpenses, categoryFilter, accountFilter]);

  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all";

  // The headline total, the pie chart and the transaction count all describe
  // whatever is currently on screen. Previously they stayed on whole-month
  // figures while the list below them was filtered.
  const visibleTotal = useMemo(
    () =>
      hasActiveFilters
        ? sumBy(filteredExpenses, (e) => e.amount)
        : (stats?.total ?? 0),
    [hasActiveFilters, filteredExpenses, stats]
  );

  const visibleByCategory = useMemo(() => {
    if (!hasActiveFilters) return stats?.byCategory ?? [];
    // Recompute from the visible rows so an account filter is reflected too.
    const centavos = new Map<string, number>();
    for (const expense of filteredExpenses) {
      centavos.set(
        expense.category,
        (centavos.get(expense.category) ?? 0) + Math.round(expense.amount * 100)
      );
    }
    return Array.from(centavos.entries())
      .map(([category, value]) => ({ category, total: value / 100 }))
      .sort((a, b) => b.total - a.total);
  }, [hasActiveFilters, stats, filteredExpenses]);

  // This month's spend per account, for the balances card.
  const monthlySpendByAccount = useMemo(() => {
    const centavos = new Map<string, number>();
    for (const expense of initialExpenses) {
      if (!expense.accountId) continue;
      centavos.set(
        expense.accountId,
        (centavos.get(expense.accountId) ?? 0) + Math.round(expense.amount * 100)
      );
    }
    return Array.from(centavos.entries()).map(([accountId, value]) => ({
      accountId,
      total: value / 100,
    }));
  }, [initialExpenses]);

  const emergencyUsed = useMemo(() => {
    const spend = new Map(monthlySpendByAccount.map((s) => [s.accountId, s.total]));
    return accountBalances
      .filter((a) => a.emergencyOnly && (spend.get(a.id) ?? 0) > 0)
      .map((a) => ({ name: a.name, total: spend.get(a.id) ?? 0 }));
  }, [accountBalances, monthlySpendByAccount]);

  const overallBudget = useMemo(
    () => budgetGoals.find((g) => g.category === "overall")?.amount ?? null,
    [budgetGoals]
  );

  // ==========================================
  // Month Navigation
  // ==========================================
  // parseMonthParam never consults today's date, so the label cannot drift
  // onto another month when the app is opened on the 29th-31st.
  const { year, month } = parseMonthParam(currentMonth) ?? monthOf(today());
  const monthDate = monthRange(year, month).start;
  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate);

  const navigateMonth = (direction: -1 | 1) => {
    // addMonthsClamped, not setMonth: Jan 31 + 1 month must be February.
    const target = monthOf(addMonthsClamped(monthDate, direction));
    router.push(
      `/dashboard/expenses?month=${formatMonthParam(target.year, target.month)}`
    );
  };

  const currentMonthInfo = monthOf(today());
  const isCurrentMonth =
    year === currentMonthInfo.year && month === currentMonthInfo.month;

  // Only meaningful for the month in progress: a finished month is 100% gone
  // and a future month has not started.
  const monthProgress = useMemo(() => {
    if (!isCurrentMonth) return null;
    const { end } = monthRange(year, month);
    const daysInMonth = end.getUTCDate();
    return Math.min(today().getUTCDate() / daysInMonth, 1);
  }, [isCurrentMonth, year, month]);

  // ==========================================
  // Handlers
  // ==========================================
  const handleCreate = async (data: CreateExpenseInput) => {
    const result = await createExpense(data);
    if (result.success) {
      toast.success("Expense recorded");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to add expense");
      throw new Error(result.error);
    }
  };

  const handleUpdate = async (data: CreateExpenseInput) => {
    if (!editingExpense) return;

    const updateData: UpdateExpenseInput = {
      id: editingExpense.id,
      ...data,
    };

    const result = await updateExpense(updateData);
    if (result.success) {
      toast.success("Expense updated");
      setEditingExpense(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update expense");
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteExpense(deleteId);
    if (result.success) {
      toast.success("Expense deleted");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingExpense(null);
    }
  };

  const handleSaveBudget = async (data: { category: string; amount: number }) => {
    const isEditing = !!editingBudget;

    // Editing is a single atomic server call. The old flow upserted the new
    // category and then deleted the old row, which silently overwrote an
    // existing goal and could leave two goals behind if the delete failed.
    const result = isEditing
      ? await moveBudgetGoal({
          id: editingBudget.id,
          category: data.category,
          amount: data.amount,
        })
      : await upsertBudgetGoal({
          month: monthDate,
          category: data.category,
          amount: data.amount,
        });

    if (result.success) {
      toast.success(isEditing ? "Budget goal updated" : "Budget goal saved");
      setEditingBudget(null);
      startTransition(() => router.refresh());
    } else {
      const message = result.error ?? "Failed to save budget goal";
      toast.error(message);
      throw new Error(message);
    }
  };

  const handleEditBudget = (goal: BudgetGoal) => {
    setEditingBudget(goal);
    setIsBudgetFormOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!deleteBudgetId) return;

    const result = await deleteBudgetGoal(deleteBudgetId);
    if (result.success) {
      toast.success("Budget goal deleted");
      setDeleteBudgetId(null);
      if (editingBudget?.id === deleteBudgetId) {
        setEditingBudget(null);
      }
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete budget goal");
    }
  };

  const handleBudgetFormClose = (open: boolean) => {
    setIsBudgetFormOpen(open);
    if (!open) {
      setEditingBudget(null);
    }
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track your spending and manage your budget.
          </p>
        </div>
        <Button variant="cta" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[160px] text-center">{monthLabel}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/expenses")}
          >
            Today
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {monthLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl tracking-tight">{formatCurrency(visibleTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredExpenses.length} transaction
                {filteredExpenses.length !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtered)"}
              </p>
              {!hasActiveFilters && stats.spendingChange !== null && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    stats.spendingChange > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {stats.spendingChange > 0 ? "▲" : "▼"}{" "}
                  {Math.abs(stats.spendingChange)}% vs last month (
                  {formatCurrency(stats.previousMonthTotal)})
                </p>
              )}
              {!hasActiveFilters && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.averagePerDay)} average per day
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <ExpensePieChart data={visibleByCategory} totalAmount={visibleTotal} />
        </div>
      )}

      {/* Trend + balances */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats && (
          <SpendingTrend
            dailyTotals={stats.dailyTotals}
            month={currentMonth}
            budget={overallBudget}
          />
        )}
        <AccountBalances
          balances={accountBalances}
          totalAvailable={totalAvailable}
          totalOwed={totalOwed}
          monthlySpend={monthlySpendByAccount}
          emergencyUsed={emergencyUsed}
        />
      </div>

      {/* Budget Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            Budget Goals
            {hasActiveFilters && (
              <span className="font-normal">(whole month)</span>
            )}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingBudget(null);
              setIsBudgetFormOpen(true);
            }}
          >
            {budgetGoals.length > 0 ? "Add Goal" : "Set Budget"}
          </Button>
        </div>
        {budgetGoals.length > 0 ? (
          <BudgetProgress
            goals={budgetGoals}
            spending={stats?.byCategory ?? []}
            totalSpent={stats?.total ?? 0}
            onEditGoal={handleEditBudget}
            onDeleteGoal={(goal) => setDeleteBudgetId(goal.id)}
            monthProgress={monthProgress}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No budget goals set for {monthLabel}. Add one to track monthly limits.
          </div>
        )}
        {!stats && budgetGoals.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Budget goals are available, but monthly spending stats could not be loaded.
          </p>
        )}
        {budgetLoadFailed && (
          <p className="text-xs text-destructive">
            Budget goals could not be loaded for this month. You can still set a new one.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {accountBalances.length > 0 && (
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accountBalances.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                  {account.emergencyOnly ? " 🚨" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryFilter("all");
              setAccountFilter("all");
            }}
            className="h-9"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter info */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredExpenses.length} of {initialExpenses.length} expenses
          </span>
        </div>
      )}

      {/* Recurring */}
      <RecurringExpenses recurring={recurring} accounts={accountBalances} />

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-12 w-12" />}
          title={hasActiveFilters ? "No expenses match filter" : "No expenses recorded"}
          description={
            hasActiveFilters
              ? "Try changing the category filter"
              : "Start tracking your spending"
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
              account={accountBalances.find((a) => a.id === expense.accountId)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
        defaultValues={editingExpense ?? undefined}
        mode={editingExpense ? "edit" : "create"}
        accounts={accountBalances}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteBudgetId}
        onOpenChange={(open) => !open && setDeleteBudgetId(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Budget Goal"
        description="Are you sure you want to delete this budget goal? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />

      {/* Budget Goal Form */}
      <BudgetGoalForm
        open={isBudgetFormOpen}
        onOpenChange={handleBudgetFormClose}
        onSubmit={handleSaveBudget}
        defaultCategory={editingBudget?.category}
        defaultAmount={editingBudget?.amount}
        mode={editingBudget ? "edit" : "create"}
        takenCategories={budgetGoals.map((g) => g.category)}
      />
    </div>
  );
}
