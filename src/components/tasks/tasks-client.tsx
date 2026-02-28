"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, LayoutList, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { isToday, isTomorrow, isPast, isThisWeek, startOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TaskForm, TaskList, TaskDetailDialog } from "@/components/tasks";
import { ConfirmDialog } from "@/components/shared";
import { createTask, updateTask, deleteTask } from "@/actions/tasks";
import { TASK_GROUPS } from "@/constants";
import type { Task, Priority } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/task";

// ==========================================
// Types
// ==========================================
interface TasksClientProps {
  initialTasks: Task[];
}

type LayoutType = "list" | "grid";
type PriorityFilter = "all" | Priority;
type DateFilter = "all" | "today" | "tomorrow" | "this-week" | "overdue" | "no-date";
type GroupFilter = "all" | string;

// ==========================================
// Constants
// ==========================================
const PRIORITY_FILTER_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This Week" },
  { value: "overdue", label: "Overdue" },
  { value: "no-date", label: "No Due Date" },
];

const GROUP_FILTER_OPTIONS: { value: GroupFilter; label: string }[] = [
  { value: "all", label: "All Groups" },
  { value: "_none", label: "No Group" },
  ...TASK_GROUPS.map((g) => ({ value: g.value, label: `${g.icon} ${g.label}` })),
];

const PAGE_SIZE = 10;

// ==========================================
// Component
// ==========================================
export function TasksClient({ initialTasks }: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Layout state
  const [layout, setLayout] = useState<LayoutType>("list");

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Detail dialog state
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // ==========================================
  // Filtered Tasks
  // ==========================================
  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Group filter
      if (groupFilter !== "all") {
        if (groupFilter === "_none" && task.group !== null) return false;
        if (groupFilter !== "_none" && task.group !== groupFilter) return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = startOfDay(new Date());

        switch (dateFilter) {
          case "today":
            if (!dueDate || !isToday(dueDate)) return false;
            break;
          case "tomorrow":
            if (!dueDate || !isTomorrow(dueDate)) return false;
            break;
          case "this-week":
            if (!dueDate || !isThisWeek(dueDate, { weekStartsOn: 1 })) return false;
            break;
          case "overdue":
            if (!dueDate || !isPast(dueDate) || isToday(dueDate)) return false;
            break;
          case "no-date":
            if (dueDate) return false;
            break;
        }
      }

      return true;
    });
  }, [initialTasks, priorityFilter, dateFilter, groupFilter]);

  const hasActiveFilters = priorityFilter !== "all" || dateFilter !== "all" || groupFilter !== "all";

  const clearFilters = () => {
    setPriorityFilter("all");
    setDateFilter("all");
    setGroupFilter("all");
    setCurrentPage(1);
  };

  // ==========================================
  // Handlers
  // ==========================================
  const handleCreate = async (data: CreateTaskInput) => {
    const result = await createTask(data);
    if (result.success) {
      toast.success("Task created successfully");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to create task");
      throw new Error(result.error);
    }
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;

    const updateData: UpdateTaskInput = {
      id: editingTask.id,
      ...data,
    };

    const result = await updateTask(updateData);
    if (result.success) {
      toast.success("Task updated successfully");
      setEditingTask(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update task");
      throw new Error(result.error);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const result = await updateTask({ id, completed });
    if (result.success) {
      toast.success(completed ? "Task completed!" : "Task marked incomplete");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteTask(deleteId);
    if (result.success) {
      toast.success("Task deleted");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete task");
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks and stay productive.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters & Layout Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(value) => { setPriorityFilter(value as PriorityFilter); setCurrentPage(1); }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Group Filter */}
          <Select
            value={groupFilter}
            onValueChange={(value) => { setGroupFilter(value as GroupFilter); setCurrentPage(1); }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select
            value={dateFilter}
            onValueChange={(value) => { setDateFilter(value as DateFilter); setCurrentPage(1); }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={layout === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayout("list")}
            className="h-8 px-2"
          >
            <LayoutList className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
          <Button
            variant={layout === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayout("grid")}
            className="h-8 px-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
        </div>
      </div>

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredTasks.length} of {initialTasks.length} tasks
          </span>
        </div>
      )}

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        layout={layout}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={async (id) => setDeleteId(id)}
        onClick={(task) => setViewingTask(task)}
        onAddNew={() => setIsFormOpen(true)}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        emptyMessage={hasActiveFilters ? "No tasks match filters" : "No tasks yet"}
        emptyDescription={
          hasActiveFilters
            ? "Try adjusting your filters or create a new task"
            : "Create your first task to get started"
        }
      />

      {/* Create/Edit Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        defaultValues={editingTask ?? undefined}
        mode={editingTask ? "edit" : "create"}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={viewingTask}
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        onToggleComplete={handleToggleComplete}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
