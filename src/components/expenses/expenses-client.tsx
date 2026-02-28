"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet, X, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, parse } from "date-fns";

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
import { ConfirmDialog, EmptyState } from "@/components/shared";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import { formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import type { Expense } from "@/types";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/lib/validations/expense";

// ==========================================
// Types
// ==========================================
interface ExpensesClientProps {
  initialExpenses: Expense[];
  stats: {
    total: number;
    byCategory: { category: string; total: number }[];
  } | null;
  currentMonth: string; // "YYYY-MM"
}

type CategoryFilter = "all" | string;

// ==========================================
// Component
// ==========================================
export function ExpensesClient({ initialExpenses, stats, currentMonth }: ExpensesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ==========================================
  // Filtered Expenses
  // ==========================================
  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return initialExpenses;
    return initialExpenses.filter((e) => e.category === categoryFilter);
  }, [initialExpenses, categoryFilter]);

  const hasActiveFilters = categoryFilter !== "all";

  // ==========================================
  // Month Navigation
  // ==========================================
  const monthDate = parse(currentMonth, "yyyy-MM", new Date());
  const monthLabel = format(monthDate, "MMMM yyyy");

  const navigateMonth = (direction: -1 | 1) => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + direction);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/dashboard/expenses?month=${newMonth}`);
  };

  const isCurrentMonth =
    monthDate.getFullYear() === new Date().getFullYear() &&
    monthDate.getMonth() === new Date().getMonth();

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

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track your spending and manage your budget.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
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
              <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {initialExpenses.length} transaction{initialExpenses.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <ExpensePieChart data={stats.byCategory} totalAmount={stats.total} />
        </div>
      )}

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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter("all")}
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
    </div>
  );
}
