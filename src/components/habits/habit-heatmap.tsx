"use client";

import { useMemo } from "react";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HabitLog } from "@/types";

interface HabitHeatmapProps {
  logs: HabitLog[];
  habitName: string;
  /** Number of weeks to show (default: 16 = ~4 months) */
  weeks?: number;
}

export function HabitHeatmap({ logs, habitName, weeks = 16 }: HabitHeatmapProps) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const startDate = startOfWeek(subDays(today, totalDays - 1), { weekStartsOn: 0 });

    // Build a set of completed dates for fast lookup (using UTC dates from DB)
    const completedSet = new Set<string>();
    for (const log of logs) {
      if (log.completed) {
        const d = new Date(log.date);
        // Use UTC components since DB stores dates in UTC
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        completedSet.add(key);
      }
    }

    // Build grid: array of weeks, each with 7 days
    const gridData: { date: Date; completed: boolean; future: boolean }[][] = [];
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let currentDate = new Date(startDate);
    for (let w = 0; w < weeks; w++) {
      const week: { date: Date; completed: boolean; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(currentDate);
        const isFuture = cellDate > today;
        const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
        const completed = completedSet.has(key);

        // Track month labels
        if (cellDate.getMonth() !== lastMonth && d === 0) {
          lastMonth = cellDate.getMonth();
          monthLabels.push({
            label: format(cellDate, "MMM"),
            colIndex: w,
          });
        }

        week.push({ date: cellDate, completed, future: isFuture });
        currentDate = addDays(currentDate, 1);
      }
      gridData.push(week);
    }

    return { grid: gridData, months: monthLabels };
  }, [logs, weeks]);

  const completedCount = logs.filter((l) => l.completed).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Activity Heatmap</CardTitle>
        <p className="text-xs text-muted-foreground">
          {completedCount} completion{completedCount !== 1 ? "s" : ""} in the last {weeks} weeks
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {months.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="text-[10px] text-muted-foreground"
                style={{
                  position: "relative",
                  left: `${m.colIndex * 14}px`,
                  marginRight: i < months.length - 1
                    ? `${(months[i + 1]?.colIndex - m.colIndex) * 14 - 24}px`
                    : 0,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                <div
                  key={i}
                  className="h-[12px] w-6 text-[10px] text-muted-foreground leading-[12px] text-right pr-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className={cn(
                      "h-[12px] w-[12px] rounded-[2px] transition-colors",
                      day.future
                        ? "bg-muted/30"
                        : day.completed
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-muted hover:bg-muted-foreground/20"
                    )}
                    title={`${format(day.date, "MMM d, yyyy")}${day.completed ? " ✓" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="h-[10px] w-[10px] rounded-[2px] bg-muted" />
            <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500/40 dark:bg-green-400/40" />
            <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500 dark:bg-green-400" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
