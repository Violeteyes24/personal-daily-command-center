"use client";

import { useEffect, useRef } from "react";
import {
  isNotificationSupported,
  showNotification,
} from "@/lib/notifications";
import type { Habit } from "@/types";

interface HabitReminderProviderProps {
  habits: Habit[];
}

/**
 * Client component that checks habit reminder times every minute.
 * If the current time matches a habit's reminderTime (HH:MM), it sends
 * a browser notification. Keeps a set of already-fired reminders for today
 * to avoid duplicate notifications.
 */
export function HabitReminderProvider({ habits }: HabitReminderProviderProps) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (Notification.permission !== "granted") return;

    const remindableHabits = habits.filter(
      (h) => h.reminderEnabled && h.reminderTime
    );
    if (remindableHabits.length === 0) return;

    // Reset fired set at midnight
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
        now.getTime();
      return setTimeout(() => {
        firedRef.current.clear();
      }, msUntilMidnight);
    };

    const midnightTimer = resetAtMidnight();

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayKey = now.toDateString();

      for (const habit of remindableHabits) {
        const key = `${habit.id}-${todayKey}`;
        if (habit.reminderTime === currentTime && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          showNotification(`${habit.icon ?? "✅"} Habit Reminder`, {
            body: `Time to: ${habit.name}`,
            tag: `habit-${habit.id}`,
          });
        }
      }
    };

    // Check immediately on mount
    checkReminders();

    // Then check every 30 seconds
    const interval = setInterval(checkReminders, 30_000);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [habits]);

  // This component renders nothing
  return null;
}
