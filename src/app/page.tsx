import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  TrendingUp,
  Wallet,
  StickyNote,
  Smile,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            CC
          </div>
          <span className="text-xl font-bold text-white">Command Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Your Personal
          <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Life Dashboard
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Track your tasks, build habits, manage expenses, and reflect on your
          day — all in one beautiful, simple dashboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Start for Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CheckSquare className="h-6 w-6" />}
            title="Task Management"
            description="Prioritize your day with smart task lists. Focus on what matters most."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Habit Tracking"
            description="Build streaks and track your progress. Small steps, big results."
          />
          <FeatureCard
            icon={<Wallet className="h-6 w-6" />}
            title="Expense Tracking"
            description="Know where your money goes. Quick input, clear insights."
          />
          <FeatureCard
            icon={<StickyNote className="h-6 w-6" />}
            title="Quick Notes"
            description="Capture thoughts instantly. Tag and organize effortlessly."
          />
          <FeatureCard
            icon={<Smile className="h-6 w-6" />}
            title="Mood Check-in"
            description="Track your emotional well-being. Spot patterns over time."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Daily Insights"
            description="Beautiful charts and trends. See your progress at a glance."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto border-t border-slate-700 px-6 py-8 text-center text-sm text-slate-400">
        Built with Next.js, TypeScript, and ❤️
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-left transition-colors hover:border-slate-600 hover:bg-slate-800">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}
