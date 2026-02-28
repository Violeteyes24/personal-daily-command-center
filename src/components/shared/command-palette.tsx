"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  FileText,
  Heart,
  DollarSign,
  Smile,
  Settings,
  LayoutDashboard,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "task" | "note" | "habit" | "expense" | "mood";
  href: string;
}

const QUICK_LINKS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Tasks", icon: CheckSquare, href: "/dashboard/tasks" },
  { label: "Habits", icon: Heart, href: "/dashboard/habits" },
  { label: "Expenses", icon: DollarSign, href: "/dashboard/expenses" },
  { label: "Notes", icon: FileText, href: "/dashboard/notes" },
  { label: "Mood", icon: Smile, href: "/dashboard/mood" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
] as const;

const TYPE_ICONS: Record<SearchResult["type"], typeof CheckSquare> = {
  task: CheckSquare,
  note: FileText,
  habit: Heart,
  expense: DollarSign,
  mood: Smile,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  const doSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length < 2) {
        setResults([]);
        return;
      }

      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(value)}`
          );
          if (res.ok) {
            const data = await res.json();
            setResults(data.results ?? []);
          }
        } catch {
          // Silently fail search
        }
      });
    },
    []
  );

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tasks, notes, habits, expenses..."
        value={query}
        onValueChange={doSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isPending ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search results */}
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((result) => {
              const Icon = TYPE_ICONS[result.type];
              return (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  value={`${result.type}-${result.title}`}
                  onSelect={() => handleSelect(result.href)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Quick links (always shown) */}
        {results.length > 0 && <CommandSeparator />}
        <CommandGroup heading="Quick Links">
          {QUICK_LINKS.map((link) => (
            <CommandItem
              key={link.href}
              value={link.label}
              onSelect={() => handleSelect(link.href)}
            >
              <link.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
