"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { isToday } from "date-fns";

import { Button } from "@/components/ui/button";
import { HabitForm } from "./habit-form";
import { HabitCard } from "./habit-card";
import { ConfirmDialog, EmptyState } from "@/components/shared";
import { createHabit, updateHabit, deleteHabit, logHabit } from "@/actions/habits";
import type { Habit } from "@/types";
import type { CreateHabitInput, UpdateHabitInput } from "@/lib/validations/habit";

// ==========================================
// Types
// ==========================================
interface HabitsClientProps {
  initialHabits: Habit[];
}

// ==========================================
// Component
// ==========================================
export function HabitsClient({ initialHabits }: HabitsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ==========================================
  // Helpers
  // ==========================================
  const isTodayCompleted = (habit: Habit): boolean => {
    if (!habit.logs) return false;
    return habit.logs.some(
      (log) => log.completed && isToday(new Date(log.date))
    );
  };

  // ==========================================
  // Handlers
  // ==========================================
  const handleCreate = async (data: CreateHabitInput) => {
    const result = await createHabit(data);
    if (result.success) {
      toast.success("Habit created successfully");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to create habit");
      throw new Error(result.error);
    }
  };

  const handleUpdate = async (data: CreateHabitInput) => {
    if (!editingHabit) return;

    const updateData: UpdateHabitInput = {
      id: editingHabit.id,
      ...data,
    };

    const result = await updateHabit(updateData);
    if (result.success) {
      toast.success("Habit updated successfully");
      setEditingHabit(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update habit");
      throw new Error(result.error);
    }
  };

  const handleToggleToday = async (habitId: string, completed: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await logHabit({
      habitId,
      date: today,
      completed,
    });

    if (result.success) {
      toast.success(completed ? "Habit completed! 🎉" : "Habit unchecked");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to log habit");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteHabit(deleteId);
    if (result.success) {
      toast.success("Habit deleted");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete habit");
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingHabit(null);
    }
  };

  // Separate completed and incomplete for today
  const completedToday = initialHabits.filter((h) => isTodayCompleted(h));
  const pendingToday = initialHabits.filter((h) => !isTodayCompleted(h));

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Habits</h1>
          <p className="text-muted-foreground">
            Build streaks and track your daily habits.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Habit
        </Button>
      </div>

      {/* Progress Summary */}
      {initialHabits.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s Progress</p>
            <p className="text-2xl font-bold">
              {completedToday.length}/{initialHabits.length}
            </p>
          </div>
          <div className="ml-auto">
            <div className="h-3 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${initialHabits.length > 0 ? (completedToday.length / initialHabits.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      {initialHabits.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-12 w-12" />}
          title="No habits yet"
          description="Create habits to build powerful daily routines"
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pending Habits */}
          {pendingToday.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                To Do ({pendingToday.length})
              </h3>
              <div className="space-y-2">
                {pendingToday.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isTodayCompleted={false}
                    onToggleToday={handleToggleToday}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Habits */}
          {completedToday.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed ({completedToday.length})
              </h3>
              <div className="space-y-2">
                {completedToday.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isTodayCompleted={true}
                    onToggleToday={handleToggleToday}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <HabitForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingHabit ? handleUpdate : handleCreate}
        defaultValues={editingHabit ?? undefined}
        mode={editingHabit ? "edit" : "create"}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Habit"
        description="Are you sure you want to delete this habit? All streak data will be lost. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
