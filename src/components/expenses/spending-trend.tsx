"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { monthRange, parseMonthParam } from "@/lib/dates";

interface SpendingTrendProps {
  /** Per-day totals from getExpenseStats; days with no spend are absent. */
  dailyTotals: { date: string; total: number }[];
  /** "YYYY-MM" — the month being viewed. */
  month: string;
  /** Overall budget for the month, drawn as a reference line. */
  budget?: number | null;
}

export function SpendingTrend({ dailyTotals, month, budget }: SpendingTrendProps) {
  const data = useMemo(() => {
    const parsed = parseMonthParam(month);
    if (!parsed) return [];

    const { end } = monthRange(parsed.year, parsed.month);
    const byDay = new Map(dailyTotals.map((d) => [d.date, d.total]));

    // Walk every day of the month so the line shows flat stretches rather than
    // jumping between the days that happen to have expenses.
    let running = 0;
    const rows = [];
    for (let day = 1; day <= end.getUTCDate(); day++) {
      const key = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      running = Math.round((running + (byDay.get(key) ?? 0)) * 100) / 100;
      rows.push({ day, label: String(day), cumulative: running });
    }
    return rows;
  }, [dailyTotals, month]);

  if (data.length === 0 || dailyTotals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Spending over the month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Spending over the month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={16}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `₱${Math.round(v / 1000)}k`}
                width={44}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Spent so far"]}
                labelFormatter={(label: string) => `Day ${label}`}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--popover-foreground)",
                }}
              />
              {budget != null && budget > 0 && (
                <ReferenceLine
                  y={budget}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: "Budget",
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "#ef4444",
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#spendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
