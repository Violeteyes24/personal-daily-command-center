"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet, X, Filter, PieChart } from "lucide-react";
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
}

type CategoryFilter = "all" | string;

// ==========================================
// Color palette for pie chart
// ==========================================
const CHART_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#06b6d4", "#64748b",
];

// ==========================================
// Component
// ==========================================
export function ExpensesClient({ initialExpenses, stats }: ExpensesClientProps) {
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {initialExpenses.length} transaction{initialExpenses.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Category Breakdown - Simple Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byCategory.length > 0 ? (
                <div className="space-y-2">
                  {stats.byCategory
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((item, i) => {
                      const cat = EXPENSE_CATEGORIES.find(
                        (c) => c.value === item.category
                      );
                      const pct =
                        stats.total > 0
                          ? (item.total / stats.total) * 100
                          : 0;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {cat?.icon} {cat?.label || item.category}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
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
