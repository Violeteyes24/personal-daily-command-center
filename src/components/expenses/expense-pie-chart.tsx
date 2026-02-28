"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#06b6d4", "#64748b",
];

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

  const chartData = data
    .sort((a, b) => b.total - a.total)
    .map((item) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
      return {
        name: cat?.label || item.category,
        value: item.total,
        icon: cat?.icon || "📦",
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
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: unknown) => {
                  const item = chartData.find((d) => d.name === value);
                  return `${item?.icon || ""} ${value}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed breakdown below chart */}
        <div className="mt-2 space-y-1.5">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
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
