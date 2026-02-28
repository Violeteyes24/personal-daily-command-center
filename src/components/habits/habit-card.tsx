"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, MoreHorizontal, Pencil, Trash2, Flame, Bell } from "lucide-react";

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
interface HabitCardProps {
  habit: Habit;
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
  isTodayCompleted,
  onToggleToday,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);

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

  return (
    <Card
      className={cn(
        "transition-all",
        isTodayCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Check Button */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            isTodayCompleted
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
          )}
        >
          {isTodayCompleted && <Check className="h-5 w-5" />}
        </button>

        {/* Habit Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{habit.icon || "✨"}</span>
            <h3
              className={cn(
                "font-medium truncate",
                isTodayCompleted && "line-through text-muted-foreground"
              )}
            >
              {habit.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {habit.frequency}
            </Badge>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <Flame className="h-3 w-3" />
                {streak} day{streak !== 1 ? "s" : ""}
              </span>
            )}
            {habit.reminderEnabled && habit.reminderTime && (
              <span className="flex items-center gap-1 text-xs text-blue-500">
                <Bell className="h-3 w-3" />
                {habit.reminderTime}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}
