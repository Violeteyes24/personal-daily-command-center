"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, Pencil, MoreHorizontal, Zap } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared";
import { createOrUpdateMood, deleteMood } from "@/actions/mood";
import { MOOD_LEVELS, ENERGY_LEVELS } from "@/constants/categories";
import type { MoodEntry } from "@/types";

// ==========================================
// Types
// ==========================================
interface MoodClientProps {
  initialEntries: MoodEntry[];
  todayMood: MoodEntry | null;
}

// ==========================================
// Component
// ==========================================
export function MoodClient({ initialEntries, todayMood }: MoodClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Check-in state
  const [selectedMood, setSelectedMood] = useState<number | null>(
    todayMood?.mood ?? null
  );
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(
    todayMood?.energy ?? null
  );
  const [note, setNote] = useState(todayMood?.note ?? "");
  const [hasCheckedIn, setHasCheckedIn] = useState(!!todayMood);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (!selectedMood) {
      toast.error("Please select how you're feeling");
      return;
    }

    startTransition(async () => {
      const result = await createOrUpdateMood({
        mood: selectedMood,
        energy: selectedEnergy ?? undefined,
        note: note.trim() || undefined,
        date: new Date(),
      });

      if (result.success) {
        toast.success(hasCheckedIn ? "Mood updated!" : "Mood logged!");
        setHasCheckedIn(true);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save mood");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteMood(id);
      if (result.success) {
        toast.success("Mood entry deleted");
        // If we deleted today's entry, reset the check-in form
        if (todayMood?.id === id) {
          setSelectedMood(null);
          setSelectedEnergy(null);
          setNote("");
          setHasCheckedIn(false);
        }
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
      setDeleteId(null);
    });
  };

  const getMoodEmoji = (value: number) =>
    MOOD_LEVELS.find((m) => m.value === value)?.emoji ?? "😐";
  const getMoodLabel = (value: number) =>
    MOOD_LEVELS.find((m) => m.value === value)?.label ?? "Unknown";
  const getEnergyEmoji = (value: number) =>
    ENERGY_LEVELS.find((e) => e.value === value)?.emoji ?? "⚡";
  const getEnergyLabel = (value: number) =>
    ENERGY_LEVELS.find((e) => e.value === value)?.label ?? "Unknown";

  // Separate today's entry from history
  const historyEntries = initialEntries.filter(
    (entry) => entry.id !== todayMood?.id
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Mood</h1>
        <p className="text-muted-foreground">
          Track how you&apos;re feeling and spot patterns.
        </p>
      </div>

      {/* Today's Check-in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>How are you feeling today?</span>
            {hasCheckedIn && (
              <Badge variant="secondary" className="text-xs">
                ✓ Checked in
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Mood</p>
            <div className="flex justify-center gap-3">
              {MOOD_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSelectedMood(level.value)}
                  disabled={isPending}
                  className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all hover:bg-muted ${
                    selectedMood === level.value
                      ? "bg-primary/10 ring-2 ring-primary scale-110"
                      : ""
                  }`}
                >
                  <span className="text-4xl">{level.emoji}</span>
                  <span className="text-sm text-muted-foreground">
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Energy Level (optional)
            </p>
            <div className="flex justify-center gap-3">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    setSelectedEnergy(
                      selectedEnergy === level.value ? null : level.value
                    )
                  }
                  disabled={isPending}
                  className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-all hover:bg-muted ${
                    selectedEnergy === level.value
                      ? "bg-primary/10 ring-2 ring-primary scale-110"
                      : ""
                  }`}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xs text-muted-foreground">
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Note (optional)
            </p>
            <Textarea
              placeholder="What's on your mind?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <Button
              onClick={handleCheckIn}
              disabled={!selectedMood || isPending}
              size="lg"
            >
              {isPending
                ? "Saving..."
                : hasCheckedIn
                  ? "Update Check-in"
                  : "Log Mood"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mood History */}
      <Card>
        <CardHeader>
          <CardTitle>Mood History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="text-lg">No past mood entries yet</p>
              <p className="text-sm">Check in daily to see trends</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Mood Emoji */}
                    <span className="text-3xl">{getMoodEmoji(entry.mood)}</span>

                    <div>
                      {/* Date + Labels */}
                      <p className="font-medium">
                        {format(new Date(entry.date), "EEEE, MMM d")}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getMoodLabel(entry.mood)}</span>
                        {entry.energy && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {getEnergyEmoji(entry.energy)}{" "}
                              {getEnergyLabel(entry.energy)}
                            </span>
                          </>
                        )}
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {entry.note}
                        </p>
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
                      <DropdownMenuItem
                        onClick={() => setDeleteId(entry.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Mood Entry"
        description="Are you sure you want to delete this mood entry? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
