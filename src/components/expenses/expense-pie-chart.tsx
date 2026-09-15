"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#06b6d4", "#64748b",
];

/**
 * Colour by category, not by position in the sorted list — otherwise a
 * category changes colour from month to month as the ranking shifts.
 */
function colorFor(category: string): string {
  const index = EXPENSE_CATEGORIES.findIndex((c) => c.value === category);
  return COLORS[(index === -1 ? EXPENSE_CATEGORIES.length : index) % COLORS.length];
}

interface ExpensePieChartProps {
  data: { category: string; total: number }[];
  totalAmount: number;
}

export function ExpensePieChart({ data, totalAmount }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  // Copy before sorting: `data` is the same array the budget progress card
  // renders from, and Array.prototype.sort mutates in place.
  const chartData = [...data]
    .sort((a, b) => b.total - a.total)
    .map((item) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
      return {
        name: cat?.label || item.category,
        value: item.total,
        icon: cat?.icon || "📦",
        color: colorFor(item.category),
        pct: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : "0",
      };
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--popover-foreground)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => {
                  const item = chartData.find((d) => d.name === value);
                  return `${item?.icon || ""} ${value}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed breakdown below chart */}
        <div className="mt-2 space-y-1.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  {item.icon} {item.name}
                </span>
              </div>
              <span className="font-medium">
                {formatCurrency(item.value)}{" "}
                <span className="text-xs text-muted-foreground">({item.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
