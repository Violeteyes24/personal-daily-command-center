"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TaskForm, TaskList } from "@/components/tasks";
import { ConfirmDialog } from "@/components/shared";
import { createTask, updateTask, deleteTask } from "@/actions/tasks";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/task";

// ==========================================
// Types
// ==========================================
interface TasksClientProps {
  initialTasks: Task[];
}

// ==========================================
// Component
// ==========================================
export function TasksClient({ initialTasks }: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
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

      {/* Task List */}
      <TaskList
        tasks={initialTasks}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={async (id) => setDeleteId(id)}
        onAddNew={() => setIsFormOpen(true)}
      />

      {/* Create/Edit Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        defaultValues={editingTask ?? undefined}
        mode={editingTask ? "edit" : "create"}
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
