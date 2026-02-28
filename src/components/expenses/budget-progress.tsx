"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { BudgetGoal } from "@/types";

interface BudgetProgressProps {
  goals: BudgetGoal[];
  spending: { category: string; total: number }[];
  totalSpent: number;
}

export function BudgetProgress({ goals, spending, totalSpent }: BudgetProgressProps) {
  const items = useMemo(() => {
    return goals.map((goal) => {
      const isOverall = !goal.category;
      const spent = isOverall
        ? totalSpent
        : spending.find((s) => s.category === goal.category)?.total ?? 0;
      const pct = goal.amount > 0 ? Math.min((spent / goal.amount) * 100, 100) : 0;
      const over = spent > goal.amount;
      const catInfo = isOverall
        ? { icon: "💰", label: "Overall" }
        : EXPENSE_CATEGORIES.find((c) => c.value === goal.category) ?? {
            icon: "📦",
            label: goal.category ?? "Unknown",
          };

      return { ...goal, spent, pct, over, catInfo };
    });
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {item.catInfo.icon} {item.catInfo.label}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  item.over ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                )}
              >
                {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
              </span>
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
