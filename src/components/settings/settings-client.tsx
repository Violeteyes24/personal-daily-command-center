"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, User, Palette, SlidersHorizontal, Download, FileJson, FileSpreadsheet, Bell } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TASK_GROUPS } from "@/constants";

interface SettingsClientProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
    createdAt?: string;
  };
}

const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "THB", label: "THB (฿)", symbol: "฿" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
] as const;

const WEEK_STARTS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
] as const;

export function SettingsClient({ user }: SettingsClientProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [defaultTaskGroup, setDefaultTaskGroup] = useState("personal");
  const [weekStart, setWeekStart] = useState("sunday");
  const [exportScope, setExportScope] = useState("all");
  const [exporting, setExporting] = useState<string | false>(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    setMounted(true);
    // Load preferences from localStorage
    const savedCurrency = localStorage.getItem("pref-currency");
    const savedGroup = localStorage.getItem("pref-default-task-group");
    const savedWeekStart = localStorage.getItem("pref-week-start");
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedGroup) setDefaultTaskGroup(savedGroup);
    if (savedWeekStart) setWeekStart(savedWeekStart);
    // Check notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function handleCurrencyChange(value: string) {
    setCurrency(value);
    localStorage.setItem("pref-currency", value);
    toast.success("Currency updated");
  }

  function handleDefaultGroupChange(value: string) {
    setDefaultTaskGroup(value);
    localStorage.setItem("pref-default-task-group", value);
    toast.success("Default task group updated");
  }

  function handleWeekStartChange(value: string) {
    setWeekStart(value);
    localStorage.setItem("pref-week-start", value);
    toast.success("Week start updated");
  }

  function handleThemeChange(value: string) {
    setTheme(value);
    toast.success(`Theme set to ${value}`);
  }

  async function handleExport(format: "json" | "csv") {
    setExporting(format);
    try {
      const res = await fetch(`/api/export?format=${format}&scope=${exportScope}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `command-center-export-${new Date().toISOString().split("T")[0]}.${format === "json" ? "json" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "U";

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information from Clerk</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl ?? undefined} alt={user.firstName ?? "User"} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="text-xs">
                Managed by Clerk
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            To update your name, email, or profile picture, visit your{" "}
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Clerk account settings
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleThemeChange(value)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Configure defaults and regional settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <p className="text-sm text-muted-foreground">
              Used for expense tracking display
            </p>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Default task group */}
          <div className="grid gap-2">
            <Label htmlFor="task-group">Default Task Group</Label>
            <p className="text-sm text-muted-foreground">
              Pre-selected group when creating new tasks
            </p>
            <Select value={defaultTaskGroup} onValueChange={handleDefaultGroupChange}>
              <SelectTrigger id="task-group" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_GROUPS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.icon} {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Week start */}
          <div className="grid gap-2">
            <Label htmlFor="week-start">Week Starts On</Label>
            <p className="text-sm text-muted-foreground">
              Used for habit streaks and weekly views
            </p>
            <Select value={weekStart} onValueChange={handleWeekStartChange}>
              <SelectTrigger id="week-start" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEK_STARTS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage browser notification permissions for habit reminders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Browser Notifications</p>
              <p className="text-xs text-muted-foreground">
                {notifPermission === "granted"
                  ? "Notifications are enabled. You'll receive habit reminders."
                  : notifPermission === "denied"
                    ? "Notifications are blocked. Please enable them in your browser settings."
                    : "Enable notifications to receive habit reminders at scheduled times."}
              </p>
            </div>
            <Button
              variant={notifPermission === "granted" ? "secondary" : "default"}
              size="sm"
              disabled={notifPermission === "denied"}
              onClick={async () => {
                if (notifPermission === "granted") return;
                const result = await Notification.requestPermission();
                setNotifPermission(result);
                if (result === "granted") {
                  toast.success("Notifications enabled!");
                } else {
                  toast.error("Notification permission denied");
                }
              }}
            >
              {notifPermission === "granted" ? "Enabled" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download your data as JSON or CSV</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="export-scope">What to export</Label>
            <Select value={exportScope} onValueChange={setExportScope}>
              <SelectTrigger id="export-scope" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="tasks">Tasks only</SelectItem>
                <SelectItem value="habits">Habits only</SelectItem>
                <SelectItem value="expenses">Expenses only</SelectItem>
                <SelectItem value="notes">Notes only</SelectItem>
                <SelectItem value="moods">Mood entries only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!!exporting}
              onClick={() => handleExport("json")}
            >
              <FileJson className="mr-2 h-4 w-4" />
              {exporting === "json" ? "Exporting..." : "Export JSON"}
            </Button>
            <Button
              variant="outline"
              disabled={!!exporting}
              onClick={() => handleExport("csv")}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {exporting === "csv" ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exports include all historical data for the selected scope.
          </p>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Deleting your account will permanently remove all your data including tasks, habits, expenses, notes, and mood entries.
          </p>
          <Button variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
