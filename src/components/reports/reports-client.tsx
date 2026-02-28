"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  TrendingUp,
  Wallet,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES, MOOD_LEVELS } from "@/constants/categories";
import type { ReportData } from "@/actions/reports";

interface ReportsClientProps {
  report: ReportData;
  type: "weekly" | "monthly";
  dateParam: string; // ISO date or YYYY-MM
}

export function ReportsClient({ report, type, dateParam }: ReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (direction: -1 | 1) => {
    const d = new Date(dateParam);
    if (type === "weekly") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    const newDate = d.toISOString().split("T")[0];
    router.push(`/dashboard/reports?type=${type}&date=${newDate}`);
  };

  const switchType = (newType: string) => {
    router.push(`/dashboard/reports?type=${newType}&date=${dateParam}`);
  };

  const isCurrentPeriod = (() => {
    const now = new Date();
    const d = new Date(dateParam);
    if (type === "weekly") {
      const diff = Math.abs(now.getTime() - d.getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    }
    return now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth();
  })();

  const spendIcon = report.spendingChange > 0
    ? <ArrowUpRight className="h-3.5 w-3.5" />
    : report.spendingChange < 0
      ? <ArrowDownRight className="h-3.5 w-3.5" />
      : <Minus className="h-3.5 w-3.5" />;

  const moodEmoji = report.avgMood
    ? MOOD_LEVELS.reduce((prev, curr) =>
        Math.abs(curr.value - report.avgMood!) < Math.abs(prev.value - report.avgMood!)
          ? curr
          : prev
      ).emoji
    : "--";

  // Custom tooltip styles for dark mode
  const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Insights and trends across all your data.
          </p>
        </div>
        <Tabs value={type} onValueChange={switchType}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Period Nav */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} disabled={isPending}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[220px] text-center">{report.periodLabel}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(1)}
          disabled={isCurrentPeriod || isPending}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentPeriod && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/reports?type=${type}`)}
          >
            Current
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.tasksCompleted}/{report.tasksCreated}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {report.taskCompletionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Habits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.habitConsistencyRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {report.habitTotalChecks} of {report.habitPossibleChecks} checks
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report.totalSpent)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  report.spendingChange > 0 ? "text-red-500" : report.spendingChange < 0 ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                {spendIcon}
                {Math.abs(report.spendingChange)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last {type === "weekly" ? "week" : "month"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Mood</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{moodEmoji} {report.avgMood ?? "--"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {report.moodEntries} entr{report.moodEntries === 1 ? "y" : "ies"} • energy {report.avgEnergy ?? "--"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Activity Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Task Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {report.dailyTasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.dailyTasks}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="created" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No task data</p>
            )}
          </CardContent>
        </Card>

        {/* Daily Spending Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {report.dailyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={report.dailyExpenses}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(142, 76%, 36%)"
                    fill="url(#expGrad)"
                    name="Spent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No expense data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Habits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Habit Consistency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.topHabits.length > 0 ? (
              report.topHabits.map((h) => {
                const pct = h.total > 0 ? Math.round((h.completed / h.total) * 100) : 0;
                return (
                  <div key={h.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {h.icon ?? "✅"} {h.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {h.completed}/{h.total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No habits tracked</p>
            )}
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.topCategories.length > 0 ? (
              report.topCategories.map((c) => {
                const catInfo = EXPENSE_CATEGORIES.find((ec) => ec.value === c.category);
                const pct = report.totalSpent > 0 ? Math.round((c.total / report.totalSpent) * 100) : 0;
                return (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span>
                      {catInfo?.icon ?? "📦"} {catInfo?.label ?? c.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {pct}%
                      </Badge>
                      <span className="text-muted-foreground font-mono text-xs">
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mood chart */}
      {report.dailyMood.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mood & Energy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={report.dailyMood}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="mood" stroke="hsl(142, 76%, 36%)" fill="url(#moodGrad)" name="Mood" />
                <Area type="monotone" dataKey="energy" stroke="hsl(217, 91%, 60%)" fill="url(#energyGrad)" name="Energy" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
