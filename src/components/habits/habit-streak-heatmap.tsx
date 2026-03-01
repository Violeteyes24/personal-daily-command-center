"use client";

import { useMemo, useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  addDays,
  startOfYear,
  endOfYear,
  differenceInWeeks,
  getYear,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Habit } from "@/types";

// ==========================================
// Types
// ==========================================
interface HabitStreakHeatmapProps {
  habits: Habit[];
}

interface DayData {
  date: Date;
  count: number;
  total: number;
  future: boolean;
}

// ==========================================
// Constants
// ==========================================
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getIntensityClass(count: number, total: number): string {
  if (count === 0) return "bg-muted dark:bg-muted";
  const ratio = count / total;
  if (ratio <= 0.25) return "bg-green-200 dark:bg-green-900";
  if (ratio <= 0.5) return "bg-green-400 dark:bg-green-700";
  if (ratio <= 0.75) return "bg-green-500 dark:bg-green-500";
  return "bg-green-600 dark:bg-green-400";
}

// ==========================================
// Component
// ==========================================
export function HabitStreakHeatmap({ habits }: HabitStreakHeatmapProps) {
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const totalHabits = habits.length;

  const { grid, months, totalCompletions } = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const today = new Date();

    // Start from the Sunday of the week containing Jan 1
    const gridStart = startOfWeek(yearStart, { weekStartsOn: 0 });
    // End at the Saturday of the week containing Dec 31
    const lastDay = selectedYear === currentYear ? today : yearEnd;

    // Build a map of date -> completion count across all habits
    const completionMap = new Map<string, number>();
    let completionTotal = 0;

    for (const habit of habits) {
      if (!habit.logs) continue;
      for (const log of habit.logs) {
        if (!log.completed) continue;
        const d = new Date(log.date);
        const year = d.getUTCFullYear();
        if (year !== selectedYear) continue;
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        completionMap.set(key, (completionMap.get(key) || 0) + 1);
        completionTotal++;
      }
    }

    // Calculate total weeks needed
    const totalWeeks = differenceInWeeks(lastDay, gridStart) + 2;

    // Build grid: array of weeks, each with 7 days
    const gridData: DayData[][] = [];
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let currentDate = new Date(gridStart);
    for (let w = 0; w < Math.min(totalWeeks, 54); w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(currentDate);
        const isFuture = cellDate > today;
        const isBeforeYearStart = cellDate < yearStart;
        const isAfterYearEnd = cellDate > yearEnd;
        const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
        const count = (isBeforeYearStart || isAfterYearEnd) ? 0 : (completionMap.get(key) || 0);

        // Track month labels (first occurrence of each month)
        if (
          cellDate.getMonth() !== lastMonth &&
          d === 0 &&
          !isBeforeYearStart &&
          !isAfterYearEnd
        ) {
          lastMonth = cellDate.getMonth();
          monthLabels.push({
            label: MONTH_LABELS[cellDate.getMonth()],
            colIndex: w,
          });
        }

        week.push({
          date: cellDate,
          count,
          total: totalHabits,
          future: isFuture || isBeforeYearStart || isAfterYearEnd,
        });
        currentDate = addDays(currentDate, 1);
      }
      gridData.push(week);
    }

    return { grid: gridData, months: monthLabels, totalCompletions: completionTotal };
  }, [habits, selectedYear, totalHabits, currentYear]);

  // Available years: current year down to 4 years ago
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {totalCompletions} completions in {selectedYear}
            </CardTitle>
          </div>
          <div className="flex gap-1 flex-wrap">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 sm:pb-4">
        <div className="overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex ml-7 sm:ml-8 mb-1 min-w-fit">
            {months.map((m, i) => {
              const nextCol = months[i + 1]?.colIndex ?? grid.length;
              const span = nextCol - m.colIndex;
              return (
                <div
                  key={`${m.label}-${i}`}
                  className="text-[9px] sm:text-[10px] text-muted-foreground"
                  style={{
                    width: `${span * 13}px`,
                    minWidth: `${span * 13}px`,
                  }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[2px] sm:gap-0.5 min-w-fit">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] sm:gap-0.5 mr-0.5 sm:mr-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-[10px] sm:h-[12px] w-5 sm:w-6 text-[8px] sm:text-[10px] text-muted-foreground leading-[10px] sm:leading-[12px] text-right pr-0.5 sm:pr-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px] sm:gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className={cn(
                      "h-[10px] w-[10px] sm:h-[12px] sm:w-[12px] rounded-[2px] transition-colors",
                      day.future
                        ? "bg-muted/30 dark:bg-muted/10"
                        : getIntensityClass(day.count, day.total)
                    )}
                    title={
                      day.future
                        ? ""
                        : `${format(day.date, "MMM d, yyyy")} — ${day.count}/${day.total} habit${day.total !== 1 ? "s" : ""} completed`
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[2px] bg-muted dark:bg-muted" />
            <div className="h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[2px] bg-green-200 dark:bg-green-900" />
            <div className="h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[2px] bg-green-400 dark:bg-green-700" />
            <div className="h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[2px] bg-green-500 dark:bg-green-500" />
            <div className="h-[8px] w-[8px] sm:h-[10px] sm:w-[10px] rounded-[2px] bg-green-600 dark:bg-green-400" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
