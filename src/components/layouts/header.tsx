"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { getGreeting } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/layouts/sidebar";
import { CommandPalette } from "@/components/shared/command-palette";

export function Header() {
  const { user, isLoaded } = useUser();
  const [greeting, setGreeting] = useState("Hello");
  const [firstName, setFirstName] = useState("there");
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setDateString(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (isLoaded && user?.firstName) {
      setFirstName(user.firstName);
    }
  }, [isLoaded, user?.firstName]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: mobile hamburger + greeting */}
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div>
          <h2 className="text-lg font-semibold">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {dateString}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search trigger */}
        <Button
          variant="outline"
          className="relative hidden md:flex w-64 justify-start text-sm text-muted-foreground"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        >
          <Search className="mr-2 h-4 w-4" />
          Search...
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Command Palette */}
        <CommandPalette />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications (placeholder for future) */}
        <Button variant="ghost" size="icon" disabled>
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </div>
    </header>
  );
}
