import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, TrendingUp, Wallet, Smile } from "lucide-react";
import Link from "next/link";
import { getTasks } from "@/actions/tasks";
import { getHabits } from "@/actions/habits";
import { getTodayExpenses } from "@/actions/expenses";
import { getTodayMood } from "@/actions/mood";
import { MOOD_LEVELS, EXPENSE_CATEGORIES } from "@/constants/categories";
import { format, isToday, isBefore, startOfDay } from "date-fns";

export default async function DashboardPage() {
  // Fetch all data in parallel
  const [tasksResult, habitsResult, expensesResult, moodResult] =
    await Promise.all([
      getTasks(),
      getHabits(),
      getTodayExpenses(),
      getTodayMood(),
    ]);

  const tasks = tasksResult.success ? (tasksResult.data ?? []) : [];
  const habits = habitsResult.success ? (habitsResult.data ?? []) : [];
  const todayExpenses = expensesResult.success
    ? (expensesResult.data ?? [])
    : [];
  const todayMood = moodResult.success ? moodResult.data : null;

  // Compute stats
  const today = startOfDay(new Date());

  const todayTasks = tasks.filter(
    (t) =>
      (t.dueDate && isToday(new Date(t.dueDate))) ||
      (!t.dueDate && !t.completed)
  );
  const completedToday = todayTasks.filter((t) => t.completed).length;

  const totalExpensesToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate longest active streak from habits
  const todayStr = format(today, "yyyy-MM-dd");
  const habitsCompletedToday = habits.filter((h) =>
    h.logs?.some(
      (l) => format(new Date(l.date), "yyyy-MM-dd") === todayStr && l.completed
    )
  ).length;

  const moodEmoji = todayMood?.mood
    ? (MOOD_LEVELS.find((m) => m.value === todayMood.mood)?.emoji ?? "--")
    : "--";
  const moodLabel = todayMood?.mood
    ? (MOOD_LEVELS.find((m) => m.value === todayMood.mood)?.label ??
      "Not logged")
    : "Not logged";

  // Upcoming / overdue tasks (not completed, with due dates)
  const overdueTasks = tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      isBefore(new Date(t.dueDate), today)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Your personal command center at a glance.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks Today"
          value={`${todayTasks.length}`}
          subtitle={`${completedToday} completed`}
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          title="Habits Today"
          value={`${habitsCompletedToday}/${habits.length}`}
          subtitle={
            habits.length > 0
              ? `${Math.round((habitsCompletedToday / habits.length) * 100)}% done`
              : "No habits yet"
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Spent Today"
          value={`₱${totalExpensesToday.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          subtitle={`${todayExpenses.length} transaction${todayExpenses.length !== 1 ? "s" : ""}`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Mood"
          value={moodEmoji}
          subtitle={moodLabel}
          icon={<Smile className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Today&apos;s Tasks
              </span>
              <Link
                href="/dashboard/tasks"
                className="text-sm font-normal text-primary hover:underline"
              >
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <EmptyWidget message="No tasks for today" sub="Add a task to get started" />
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        task.completed
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          task.completed
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
                {todayTasks.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{todayTasks.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Habits
              </span>
              <Link
                href="/dashboard/habits"
                className="text-sm font-normal text-primary hover:underline"
              >
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <EmptyWidget message="No habits tracked yet" sub="Create habits to build streaks" />
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 5).map((habit) => {
                  const completedToday = habit.logs?.some(
                    (l) =>
                      format(new Date(l.date), "yyyy-MM-dd") === todayStr &&
                      l.completed
                  );
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <span className="text-xl">{habit.icon ?? "✅"}</span>
                      <span className="flex-1 text-sm">{habit.name}</span>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                          completedToday
                            ? "bg-green-500 text-white"
                            : "border-2 border-muted-foreground"
                        }`}
                      >
                        {completedToday && "✓"}
                      </div>
                    </div>
                  );
                })}
                {habits.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{habits.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Today&apos;s Expenses
              </span>
              <Link
                href="/dashboard/expenses"
                className="text-sm font-normal text-primary hover:underline"
              >
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayExpenses.length === 0 ? (
              <EmptyWidget message="No expenses today" sub="Track your spending" />
            ) : (
              <div className="space-y-2">
                {todayExpenses.slice(0, 5).map((expense) => {
                  const cat = EXPENSE_CATEGORIES.find(
                    (c) => c.value === expense.category
                  );
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat?.icon ?? "📦"}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {cat?.label ?? expense.category}
                          </p>
                          {expense.note && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {expense.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        -₱{expense.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
                {todayExpenses.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{todayExpenses.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Mood Check-in
              </span>
              <Link
                href="/dashboard/mood"
                className="text-sm font-normal text-primary hover:underline"
              >
                Log mood →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMood ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span className="text-6xl">
                  {MOOD_LEVELS.find((m) => m.value === todayMood.mood)?.emoji}
                </span>
                <p className="text-lg font-medium">
                  {MOOD_LEVELS.find((m) => m.value === todayMood.mood)?.label}
                </p>
                {todayMood.note && (
                  <p className="text-sm text-muted-foreground text-center max-w-[250px] line-clamp-2">
                    &ldquo;{todayMood.note}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <p className="text-muted-foreground">
                  How are you feeling today?
                </p>
                <Link href="/dashboard/mood">
                  <div className="flex gap-2">
                    {MOOD_LEVELS.map((m) => (
                      <span
                        key={m.value}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                      >
                        {m.emoji}
                      </span>
                    ))}
                  </div>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks Banner */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  ⚠️ {overdueTasks.length} overdue task
                  {overdueTasks.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overdueTasks
                    .slice(0, 3)
                    .map((t) => t.title)
                    .join(", ")}
                  {overdueTasks.length > 3 && "..."}
                </p>
              </div>
              <Link
                href="/dashboard/tasks"
                className="text-sm text-primary hover:underline"
              >
                Review →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyWidget({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <p>{message}</p>
      <p className="text-sm">{sub}</p>
    </div>
  );
}
