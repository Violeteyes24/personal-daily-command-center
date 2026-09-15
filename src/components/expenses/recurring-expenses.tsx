"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared";
import { RecurringExpenseForm } from "./recurring-expense-form";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  updateRecurringExpense,
} from "@/actions/recurring-expenses";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { cn, formatCalendarDisplay, formatCurrency } from "@/lib/utils";
import { describeRecurrence, nextRunDate, type RecurrenceKind } from "@/lib/recurrence";
import { today } from "@/lib/dates";
import type { Account, RecurringExpense } from "@/types";

interface RecurringExpensesProps {
  recurring: RecurringExpense[];
  accounts: Account[];
}

export function RecurringExpenses({ recurring, accounts }: RecurringExpensesProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const handleSubmit = async (data: {
    amount: number;
    category: string;
    accountId: string | null;
    note?: string;
    recurrence: RecurrenceKind;
    startDate: Date;
    endDate: Date | null;
  }) => {
    const result = editing
      ? await updateRecurringExpense({ id: editing.id, ...data })
      : await createRecurringExpense(data);

    if (result.success) {
      toast.success(editing ? "Recurring expense updated" : "Recurring expense added");
      setEditing(null);
      refresh();
    } else {
      const message = result.error ?? "Failed to save";
      toast.error(message);
      throw new Error(message);
    }
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    const result = await updateRecurringExpense({
      id: item.id,
      active: !item.active,
    });
    if (result.success) {
      toast.success(item.active ? "Paused" : "Resumed");
      refresh();
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteRecurringExpense(deleteId);
    if (result.success) {
      // Expenses already generated stay in the log.
      toast.success("Recurring expense removed");
      setDeleteId(null);
      refresh();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  };

  const now = today();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Repeat className="h-4 w-4" />
          Recurring
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add recurring
        </Button>
      </div>

      {recurring.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No recurring expenses. Add rent, subscriptions or load so they log
          themselves each period.
        </div>
      ) : (
        <div className="space-y-2">
          {recurring.map((item) => {
            const category = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
            const account = accounts.find((a) => a.id === item.accountId);
            const next = item.active
              ? nextRunDate({
                  recurrence: item.recurrence as RecurrenceKind,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  lastRunOn: item.lastRunOn,
                  today: now,
                })
              : null;

            return (
              <Card key={item.id} className={cn(!item.active && "opacity-60")}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                    {category?.icon ?? "📦"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {category?.label ?? item.category}
                      </Badge>
                      {account && (
                        <span className="text-xs text-muted-foreground">
                          {account.name}
                        </span>
                      )}
                      {!item.active && (
                        <Badge variant="secondary" className="text-xs">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {describeRecurrence(
                        item.recurrence as RecurrenceKind,
                        item.startDate
                      )}
                      {next && ` · next ${formatCalendarDisplay(next)}`}
                      {item.note && ` · ${item.note}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(item)}
                      aria-label={item.active ? "Pause" : "Resume"}
                    >
                      {item.active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringExpenseForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
        accounts={accounts}
        defaultValues={editing ?? undefined}
        mode={editing ? "edit" : "create"}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove recurring expense"
        description="This stops future entries. Expenses it already created stay in your log."
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}
