"use client";

import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  Circle,
  CheckCircle2,
  Repeat,
} from "lucide-react";

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
import { TASK_GROUPS, TASK_RECURRENCES } from "@/constants";
import type { Task, Priority } from "@/types";

// ==========================================
// Types
// ==========================================
type LayoutType = "list" | "grid";

interface TaskCardProps {
  task: Task;
  layout?: LayoutType;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onClick?: (task: Task) => void;
}

// ==========================================
// Constants
// ==========================================
const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
};

// ==========================================
// Helper Functions
// ==========================================
function getDueDateLabel(date: Date | null): {
  label: string;
  isOverdue: boolean;
} {
  if (!date) return { label: "", isOverdue: false };

  if (isToday(date)) {
    return { label: "Today", isOverdue: false };
  }

  const isOverdue = isPast(date) && !isToday(date);
  return {
    label: format(date, "MMM d"),
    isOverdue,
  };
}

function getGroupConfig(group: string | null) {
  if (!group) return null;
  return TASK_GROUPS.find((g) => g.value === group) ?? null;
}

// ==========================================
// Component
// ==========================================
export function TaskCard({
  task,
  layout = "list",
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
}: TaskCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDateInfo = getDueDateLabel(task.dueDate);
  const groupConfig = getGroupConfig(task.group);
  const isGrid = layout === "grid";

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleComplete(task.id, !task.completed);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // Compact List Layout
  // ==========================================
  if (!isGrid) {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent/50 cursor-pointer",
          task.completed && "opacity-60"
        )}
        onClick={() => onClick?.(task)}
      >
        {/* Checkbox */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 rounded-full p-0"
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          disabled={isToggling}
        >
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Title */}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>

        {/* Group Badge */}
        {groupConfig && (
          <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0 h-5", groupConfig.color)}>
            {groupConfig.icon} {groupConfig.label}
          </Badge>
        )}

        {/* Recurrence Badge */}
        {task.recurrence && (
          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 text-violet-600 dark:text-violet-400">
            <Repeat className="h-2.5 w-2.5 mr-0.5" />
            {TASK_RECURRENCES.find((r) => r.value === task.recurrence)?.label ?? task.recurrence}
          </Badge>
        )}

        {/* Priority Badge */}
        <Badge variant={priorityConfig.variant} className="shrink-0 text-[10px] px-1.5 py-0 h-5">
          {priorityConfig.label}
        </Badge>

        {/* Due Date */}
        {dueDateInfo.label && (
          <span
            className={cn(
              "shrink-0 flex items-center gap-1 text-[11px]",
              dueDateInfo.isOverdue && !task.completed
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {dueDateInfo.label}
          </span>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
              <Check className="mr-2 h-4 w-4" />
              {task.completed ? "Mark Incomplete" : "Mark Complete"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
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
  // Grid Layout (Card)
  // ==========================================
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer h-full",
        task.completed && "opacity-60"
      )}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-full"
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            disabled={isToggling}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "font-medium leading-tight",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
                    <Check className="mr-2 h-4 w-4" />
                    {task.completed ? "Mark Incomplete" : "Mark Complete"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
          {groupConfig && (
            <Badge variant="outline" className={cn("text-xs", groupConfig.color)}>
              {groupConfig.icon} {groupConfig.label}
            </Badge>
          )}

          {task.recurrence && (
            <Badge variant="outline" className="text-xs text-violet-600 dark:text-violet-400">
              <Repeat className="h-3 w-3 mr-0.5" />
              {TASK_RECURRENCES.find((r) => r.value === task.recurrence)?.label ?? task.recurrence}
            </Badge>
          )}

          <Badge variant={priorityConfig.variant} className="text-xs">
            {priorityConfig.label}
          </Badge>

          {dueDateInfo.label && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                dueDateInfo.isOverdue && !task.completed
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {dueDateInfo.label}
              {dueDateInfo.isOverdue && !task.completed && " (Overdue)"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
