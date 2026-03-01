"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, MoreHorizontal, Pencil, Trash2, Flame, Bell, Circle, CheckCircle2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { calculateStreak } from "@/lib/utils";
import type { Habit } from "@/types";

// ==========================================
// Types
// ==========================================
type LayoutType = "list" | "grid";

interface HabitCardProps {
  habit: Habit;
  layout?: LayoutType;
  isTodayCompleted: boolean;
  onToggleToday: (habitId: string, completed: boolean) => Promise<void>;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

// ==========================================
// Component
// ==========================================
export function HabitCard({
  habit,
  layout = "list",
  isTodayCompleted,
  onToggleToday,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const isGrid = layout === "grid";

  const streak = habit.logs
    ? calculateStreak(
        habit.logs.filter((l) => l.completed).map((l) => new Date(l.date))
      )
    : 0;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleToday(habit.id, !isTodayCompleted);
    } finally {
      setIsToggling(false);
    }
  };

  // ==========================================
  // Compact List Layout
  // ==========================================
  if (!isGrid) {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent/50",
          isTodayCompleted && "bg-green-50/50 dark:bg-green-950/10 border-green-200/50 dark:border-green-800/50 opacity-70"
        )}
      >
        {/* Checkbox */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 rounded-full p-0"
          onClick={handleToggle}
          disabled={isToggling}
        >
          {isTodayCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Icon */}
        <span className="text-base shrink-0">{habit.icon || "✨"}</span>

        {/* Name */}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            isTodayCompleted && "line-through text-muted-foreground"
          )}
        >
          {habit.name}
        </span>

        {/* Frequency Badge */}
        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex">
          {habit.frequency}
        </Badge>

        {/* Streak */}
        {streak > 0 && (
          <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-orange-500">
            <Flame className="h-3 w-3" />
            {streak}d
          </span>
        )}

        {/* Reminder */}
        {habit.reminderEnabled && habit.reminderTime && (
          <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-blue-500 hidden sm:flex">
            <Bell className="h-3 w-3" />
            {habit.reminderTime}
          </span>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(habit)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(habit.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // ==========================================
  // Grid Card Layout
  // ==========================================
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isTodayCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isTodayCompleted
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
              )}
            >
              {isTodayCompleted && <Check className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{habit.icon || "✨"}</span>
                <h3
                  className={cn(
                    "text-sm font-medium truncate",
                    isTodayCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {habit.name}
                </h3>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(habit.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            {habit.frequency}
          </Badge>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-orange-500">
              <Flame className="h-3 w-3" />
              {streak} day{streak !== 1 ? "s" : ""}
            </span>
          )}
          {habit.reminderEnabled && habit.reminderTime && (
            <span className="flex items-center gap-0.5 text-[11px] text-blue-500">
              <Bell className="h-3 w-3" />
              {habit.reminderTime}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
