"use client";

import { CheckSquare, Plus, LayoutGrid, LayoutList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { TaskCard } from "./task-card";
import type { Task } from "@/types";

// ==========================================
// Types
// ==========================================
type LayoutType = "list" | "grid";

interface TaskListProps {
  tasks: Task[];
  layout: LayoutType;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onAddNew: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
}

// ==========================================
// Component
// ==========================================
export function TaskList({
  tasks,
  layout,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddNew,
  emptyMessage = "No tasks yet",
  emptyDescription = "Create your first task to get started",
}: TaskListProps) {
  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-12 w-12" />}
        title={emptyMessage}
        description={emptyDescription}
        action={
          <Button onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        }
      />
    );
  }

  const gridClasses = layout === "grid" 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" 
    : "space-y-2";

  return (
    <div className="space-y-6">
      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            To Do ({incompleteTasks.length})
          </h3>
          <div className={gridClasses}>
            {incompleteTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout={layout}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Completed ({completedTasks.length})
          </h3>
          <div className={gridClasses}>
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout={layout}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
