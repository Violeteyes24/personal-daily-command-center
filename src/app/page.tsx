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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,oklch(0.32_0.12_293),oklch(0.14_0.03_295)_60%)]">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta text-cta-foreground font-mono text-xs font-semibold">
            CC
          </div>
          <span className="font-display text-2xl tracking-tight text-white">Command Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="cta">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-violet-300/80">
          Tasks · Habits · Money · Mood
        </p>
        <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-white sm:text-7xl">
          Your Personal
          <span className="block italic bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            Life Dashboard
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-violet-100/70">
          Track your tasks, build habits, manage expenses, and reflect on your
          day — all in one beautiful, simple dashboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" variant="cta" className="gap-2">
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
      <footer className="container mx-auto border-t border-white/10 px-6 py-8 text-center font-mono text-xs uppercase tracking-widest text-violet-200/50">
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.06]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/15 text-violet-300">
        {icon}
      </div>
      <h3 className="font-display text-2xl tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm text-violet-100/60">{description}</p>
    </div>
  );
}
