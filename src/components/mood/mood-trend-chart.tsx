"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOOD_LEVELS, ENERGY_LEVELS } from "@/constants/categories";
import type { MoodEntry } from "@/types";

interface MoodTrendChartProps {
  entries: MoodEntry[];
}

export function MoodTrendChart({ entries }: MoodTrendChartProps) {
  const chartData = useMemo(() => {
    // Sort ascending by date for chart
    return [...entries]
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(-30) // last 30 entries
      .map((entry) => ({
        date: format(new Date(entry.date), "MMM d"),
        mood: entry.mood,
        energy: entry.energy ?? undefined,
        moodEmoji: MOOD_LEVELS.find((m) => m.value === entry.mood)?.emoji ?? "😐",
      }));
  }, [entries]);

  if (entries.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Log at least 2 entries to see your mood trend
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages
  const avgMood =
    entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const energyEntries = entries.filter((e) => e.energy != null);
  const avgEnergy =
    energyEntries.length > 0
      ? energyEntries.reduce((sum, e) => sum + (e.energy ?? 0), 0) / energyEntries.length
      : null;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    const mood = payload.find((p) => p.dataKey === "mood");
    const energy = payload.find((p) => p.dataKey === "energy");
    const moodLevel = MOOD_LEVELS.find((m) => m.value === mood?.value);
    const energyLevel = ENERGY_LEVELS.find((e) => e.value === energy?.value);

    return (
      <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
        <p className="text-sm font-medium">{label}</p>
        {moodLevel && (
          <p className="text-sm">
            {moodLevel.emoji} Mood: {moodLevel.label}
          </p>
        )}
        {energyLevel && (
          <p className="text-sm">
            {energyLevel.emoji} Energy: {energyLevel.label}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Avg mood: {MOOD_LEVELS.find((m) => m.value === Math.round(avgMood))?.emoji}{" "}
            {avgMood.toFixed(1)}/5
          </span>
          {avgEnergy !== null && (
            <span>
              Avg energy:{" "}
              {ENERGY_LEVELS.find((e) => e.value === Math.round(avgEnergy))?.emoji}{" "}
              {avgEnergy.toFixed(1)}/5
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  MOOD_LEVELS.find((m) => m.value === v)?.emoji || String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#moodGrad)"
                dot={{ r: 3, fill: "#22c55e" }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#energyGrad)"
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Mood
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Energy
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
