import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { HabitReminderProvider } from "@/components/habits";
import { syncUser } from "@/lib/auth";
import { getHabits } from "@/actions/habits";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync user to database on dashboard access
  try {
    await syncUser();
  } catch (error) {
    console.error("[DashboardLayout] Failed to sync user:", error);
  }

  // Fetch habits for reminder provider
  let reminderHabits: Awaited<ReturnType<typeof getHabits>>["data"] = [];
  try {
    const result = await getHabits();
    if (result.success && result.data) {
      reminderHabits = result.data.filter(
        (h) => h.reminderEnabled && h.reminderTime
      );
    }
  } catch {
    // Reminders are non-critical, silently ignore
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64 transition-all duration-300">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      {reminderHabits.length > 0 && (
        <HabitReminderProvider habits={reminderHabits} />
      )}
    </div>
  );
}
