"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, formatCalendarDisplay, formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import type { Account, Expense } from "@/types";

// ==========================================
// Types
// ==========================================
interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  account?: Account;
}

// ==========================================
// Component
// ==========================================
export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  account,
}: ExpenseCardProps) {
  const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Category Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
          {category?.icon || "📦"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {category?.label || expense.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatCalendarDisplay(expense.date)}
            </span>
            {account && (
              <span
                className={cn(
                  "text-xs",
                  account.emergencyOnly
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground"
                )}
              >
                · {account.name}
                {account.emergencyOnly && " 🚨"}
              </span>
            )}
          </div>
          {expense.note && (
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {expense.note}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="font-semibold text-red-600 dark:text-red-400">
            -{formatCurrency(expense.amount)}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(expense.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
