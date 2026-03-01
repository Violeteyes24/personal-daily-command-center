"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, LayoutGrid, LayoutList } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HabitForm } from "./habit-form";
import { HabitCard } from "./habit-card";
import { HabitHeatmap } from "./habit-heatmap";
import { HabitStreakHeatmap } from "./habit-streak-heatmap";
import { ConfirmDialog, EmptyState } from "@/components/shared";
import { createHabit, updateHabit, deleteHabit, logHabit } from "@/actions/habits";
import type { Habit } from "@/types";
import type { CreateHabitInput, UpdateHabitInput } from "@/lib/validations/habit";

// ==========================================
// Types
// ==========================================
type LayoutType = "list" | "grid";

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

  // Layout state
  const [layout, setLayout] = useState<LayoutType>("list");

  // Heatmap selected habit
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // ==========================================
  // Helpers
  // ==========================================
  const isTodayCompleted = (habit: Habit): boolean => {
    if (!habit.logs) return false;
    // Compare UTC date components from DB with local date to avoid timezone mismatch
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();
    return habit.logs.some((log) => {
      const d = new Date(log.date);
      return (
        log.completed &&
        d.getUTCFullYear() === todayYear &&
        d.getUTCMonth() === todayMonth &&
        d.getUTCDate() === todayDate
      );
    });
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
    // Use UTC midnight for today's local date to avoid timezone shift
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const result = await logHabit({
      habitId,
      date: todayUTC,
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
          <h1 className="text-2xl sm:text-3xl font-bold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Build streaks and track your daily habits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={layout === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("list")}
              className="h-8 px-2"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("grid")}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Habit
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      {initialHabits.length > 0 && (
        <div className="flex items-center gap-3 sm:gap-4 rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Today&apos;s Progress</p>
            <p className="text-xl sm:text-2xl font-bold">
              {completedToday.length}/{initialHabits.length}
            </p>
          </div>
          <div className="ml-auto">
            <div className="h-2.5 sm:h-3 w-20 sm:w-32 overflow-hidden rounded-full bg-muted">
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
              <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-1.5"}>
                {pendingToday.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    layout={layout}
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
              <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-1.5"}>
                {completedToday.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    layout={layout}
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

      {/* GitHub-style Streak Heatmap */}
      {initialHabits.length > 0 && (
        <HabitStreakHeatmap habits={initialHabits} />
      )}

      {/* Per-habit Heatmap View */}
      {initialHabits.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
            <div className="flex flex-wrap gap-1">
              {initialHabits.map((habit) => (
                <Button
                  key={habit.id}
                  variant={selectedHabitId === habit.id ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedHabitId(selectedHabitId === habit.id ? null : habit.id)}
                >
                  {habit.icon || "✨"} {habit.name}
                </Button>
              ))}
            </div>
          </div>
          {selectedHabitId && (() => {
            const habit = initialHabits.find(h => h.id === selectedHabitId);
            if (!habit?.logs) return null;
            return <HabitHeatmap logs={habit.logs} habitName={habit.name} />;
          })()}
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
