import { getReport } from "@/actions/reports";
import { ReportsClient } from "@/components/reports";

interface ReportsPageProps {
  searchParams: Promise<{ type?: string; date?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;

  const type = params.type === "monthly" ? "monthly" : "weekly";
  const date = params.date ? new Date(params.date) : new Date();
  const dateParam = date.toISOString().split("T")[0];

  const result = await getReport(type, date);

  const report = result.success && result.data
    ? result.data
    : {
        period: type,
        periodLabel: "—",
        tasksCreated: 0,
        tasksCompleted: 0,
        taskCompletionRate: 0,
        habitTotalChecks: 0,
        habitPossibleChecks: 0,
        habitConsistencyRate: 0,
        topHabits: [],
        totalSpent: 0,
        expenseCount: 0,
        topCategories: [],
        previousPeriodSpent: 0,
        spendingChange: 0,
        avgMood: null,
        avgEnergy: null,
        moodEntries: 0,
        dailyTasks: [],
        dailyExpenses: [],
        dailyMood: [],
      };

  return <ReportsClient report={report} type={type} dateParam={dateParam} />;
}
