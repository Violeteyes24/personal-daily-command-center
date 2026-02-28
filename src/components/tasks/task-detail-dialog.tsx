"use client";

import { format, isPast, isToday } from "date-fns";
import { Calendar, Clock, Flag, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TASK_GROUPS } from "@/constants";
import type { Task, Priority } from "@/types";

// ==========================================
// Types
// ==========================================
interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ==========================================
// Constants
// ==========================================
const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; variant: "default" | "secondary" | "destructive"; color: string }
> = {
  low: { label: "Low", variant: "secondary", color: "text-slate-600 dark:text-slate-400" },
  medium: { label: "Medium", variant: "default", color: "text-yellow-600 dark:text-yellow-400" },
  high: { label: "High", variant: "destructive", color: "text-red-600 dark:text-red-400" },
};

// ==========================================
// Component
// ==========================================
export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const groupConfig = task.group ? TASK_GROUPS.find((g) => g.value === task.group) : null;

  const dueDateDisplay = task.dueDate
    ? format(new Date(task.dueDate), "EEEE, MMMM d, yyyy")
    : null;

  const isOverdue =
    task.dueDate &&
    !task.completed &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate));

  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {/* Status indicator */}
            <div
              className={cn(
                "mt-1 h-5 w-5 shrink-0 rounded-full border-2",
                task.completed
                  ? "border-green-500 bg-green-500"
                  : "border-muted-foreground"
              )}
            >
              {task.completed && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-full w-full text-white"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <DialogTitle
              className={cn(
                "text-xl leading-tight",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={priorityConfig.variant}>
              <Flag className="mr-1 h-3 w-3" />
              {priorityConfig.label} Priority
            </Badge>

            {groupConfig && (
              <Badge variant="outline" className={cn(groupConfig.color)}>
                {groupConfig.icon} {groupConfig.label}
              </Badge>
            )}

            {task.completed && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                Completed
              </Badge>
            )}

            {isOverdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}

            {isDueToday && !task.completed && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                Due Today
              </Badge>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Description
            </p>
            {task.description ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No description
              </p>
            )}
          </div>

          {/* Due Date */}
          {dueDateDisplay && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Due Date
              </p>
              <p
                className={cn(
                  "flex items-center gap-2 text-sm",
                  isOverdue && "text-destructive"
                )}
              >
                <Calendar className="h-4 w-4" />
                {dueDateDisplay}
                {isOverdue && " (Overdue)"}
                {isDueToday && " (Today)"}
              </p>
            </div>
          )}

          <Separator />

          {/* Timestamps */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
