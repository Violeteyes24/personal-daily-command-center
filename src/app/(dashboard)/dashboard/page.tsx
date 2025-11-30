import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, TrendingUp, Wallet, Smile } from "lucide-react";

export default function DashboardPage() {
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
          value="0"
          subtitle="0 completed"
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          title="Habit Streak"
          value="0 days"
          subtitle="Keep going!"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Spent Today"
          value="₱0"
          subtitle="Under budget"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Mood"
          value="--"
          subtitle="How are you feeling?"
          icon={<Smile className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Today&apos;s Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No tasks for today</p>
              <p className="text-sm">Add a task to get started</p>
            </div>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No habits tracked yet</p>
              <p className="text-sm">Create habits to build streaks</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No expenses recorded</p>
              <p className="text-sm">Track your spending</p>
            </div>
          </CardContent>
        </Card>

        {/* Mood Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Mood Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>How are you feeling today?</p>
              <p className="text-sm">Check in to track your mood</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
