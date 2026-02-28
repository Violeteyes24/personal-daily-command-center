"use client";

import { CheckSquare, Plus, ChevronLeft, ChevronRight } from "lucide-react";

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
  onClick?: (task: Task) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// ==========================================
// Pagination Component
// ==========================================
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((page, i) =>
        page === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1 text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0 text-xs"
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
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
  onClick,
  emptyMessage = "No tasks yet",
  emptyDescription = "Create your first task to get started",
  currentPage,
  pageSize,
  onPageChange,
}: TaskListProps) {
  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Combine for pagination: incomplete first, then completed
  const allSorted = [...incompleteTasks, ...completedTasks];
  const totalPages = Math.max(1, Math.ceil(allSorted.length / pageSize));

  // Paginate
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedTasks = allSorted.slice(startIdx, startIdx + pageSize);

  // Split paginated results back
  const paginatedIncomplete = paginatedTasks.filter((t) => !t.completed);
  const paginatedCompleted = paginatedTasks.filter((t) => t.completed);

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

  const gridClasses =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "space-y-1";

  return (
    <div className="space-y-6">
      {/* Incomplete Tasks */}
      {paginatedIncomplete.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            To Do ({incompleteTasks.length})
          </h3>
          <div className={gridClasses}>
            {paginatedIncomplete.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout={layout}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {paginatedCompleted.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Completed ({completedTasks.length})
          </h3>
          <div className={gridClasses}>
            {paginatedCompleted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout={layout}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
