"use client";

import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES, OVERALL_BUDGET } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { BudgetGoal } from "@/types";

interface BudgetProgressProps {
  goals: BudgetGoal[];
  spending: { category: string; total: number }[];
  totalSpent: number;
  onEditGoal?: (goal: BudgetGoal) => void;
  onDeleteGoal?: (goal: BudgetGoal) => void;
  /** Fraction of the month elapsed (0-1). Omitted for past/future months. */
  monthProgress?: number | null;
}

/**
 * Compares spend-to-date against how much of the month has elapsed, so a
 * budget that is 60% used on day 5 reads as a problem rather than "fine".
 */
function PacingNote({
  spent,
  budget,
  monthProgress,
}: {
  spent: number;
  budget: number;
  monthProgress: number;
}) {
  const expected = budget * monthProgress;
  const difference = Math.round((spent - expected) * 100) / 100;

  // Ignore trivial gaps so the line is not noise.
  if (Math.abs(difference) < Math.max(budget * 0.02, 1)) {
    return <p className="text-xs text-muted-foreground">Right on pace</p>;
  }

  const ahead = difference > 0;
  return (
    <p
      className={cn(
        "text-xs",
        ahead
          ? "text-amber-600 dark:text-amber-500"
          : "text-emerald-600 dark:text-emerald-400"
      )}
    >
      {formatCurrency(Math.abs(difference))} {ahead ? "ahead of" : "under"} pace
      ({Math.round(monthProgress * 100)}% of the month gone)
    </p>
  );
}

export function BudgetProgress({
  goals,
  spending,
  totalSpent,
  onEditGoal,
  onDeleteGoal,
  monthProgress = null,
}: BudgetProgressProps) {
  const items = useMemo(() => {
    return goals.map((goal) => {
      const isOverall = goal.category === OVERALL_BUDGET;
      const spent = isOverall
        ? totalSpent
        : (spending.find((s) => s.category === goal.category)?.total ?? 0);
      const pct = goal.amount > 0 ? Math.min((spent / goal.amount) * 100, 100) : 0;
      const over = spent > goal.amount;
      const catInfo = isOverall
        ? { icon: "💰", label: "Overall" }
        : (EXPENSE_CATEGORIES.find((c) => c.value === goal.category) ?? {
            icon: "📦",
            label: goal.category,
          });

      return { ...goal, spent, pct, over, catInfo, isOverall };
    }).sort((a, b) => Number(b.isOverall) - Number(a.isOverall));
  }, [goals, spending, totalSpent]);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Budget Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="font-medium">
                {item.catInfo.icon} {item.catInfo.label}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    item.over ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
                </span>
                {onEditGoal && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEditGoal(item)}
                    aria-label="Edit budget goal"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDeleteGoal && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDeleteGoal(item)}
                    aria-label="Delete budget goal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  item.over
                    ? "bg-red-500"
                    : item.pct > 80
                      ? "bg-yellow-500"
                      : "bg-emerald-500"
                )}
                style={{ width: `${item.pct}%` }}
              />
            </div>
            {item.over && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Over budget by {formatCurrency(item.spent - item.amount)}
              </p>
            )}
            {!item.over && item.isOverall && monthProgress !== null && (
              <PacingNote
                spent={item.spent}
                budget={item.amount}
                monthProgress={monthProgress}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
