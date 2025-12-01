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

// ==========================================
// Component
// ==========================================
export function TaskCard({
  task,
  layout = "list",
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDateInfo = getDueDateLabel(task.dueDate);
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

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        task.completed && "opacity-60",
        isGrid && "h-full"
      )}
    >
      <CardContent className={cn(
        "flex items-start gap-3 p-4",
        isGrid && "flex-col"
      )}>
        {/* Header Row (Checkbox + Actions) */}
        <div className={cn(
          "flex items-start gap-3",
          isGrid && "w-full"
        )}>
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-full"
            onClick={handleToggle}
            disabled={isToggling}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          {/* Content */}
          <div className={cn("min-w-0 flex-1", isGrid && "w-full")}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium leading-tight",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className={cn(
                    "mt-1 text-sm text-muted-foreground",
                    isGrid ? "line-clamp-3" : "line-clamp-2"
                  )}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
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
          </div>
        </div>

        {/* Meta Info */}
        <div className={cn(
          "flex flex-wrap items-center gap-2",
          !isGrid && "mt-2",
          isGrid && "w-full mt-auto pt-2"
        )}>
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
