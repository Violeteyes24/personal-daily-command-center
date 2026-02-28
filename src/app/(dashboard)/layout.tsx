import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { syncUser } from "@/lib/auth";

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
