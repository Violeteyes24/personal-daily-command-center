import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const scope = request.nextUrl.searchParams.get("scope") ?? "all";

  // Fetch all user data in parallel
  const [tasks, habits, expenses, notes, moods] = await Promise.all([
    scope === "all" || scope === "tasks"
      ? db.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    scope === "all" || scope === "habits"
      ? db.habit.findMany({
          where: { userId },
          include: { logs: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    scope === "all" || scope === "expenses"
      ? db.expense.findMany({ where: { userId }, orderBy: { date: "desc" } })
      : Promise.resolve([]),
    scope === "all" || scope === "notes"
      ? db.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } })
      : Promise.resolve([]),
    scope === "all" || scope === "moods"
      ? db.moodEntry.findMany({ where: { userId }, orderBy: { date: "desc" } })
      : Promise.resolve([]),
  ]);

  if (format === "csv") {
    const lines: string[] = [];

    // Tasks CSV
    if (tasks.length > 0) {
      lines.push("=== TASKS ===");
      lines.push("id,title,description,priority,group,dueDate,completed,recurrence,createdAt");
      for (const t of tasks) {
        lines.push(
          [
            t.id,
            csvEscape(t.title),
            csvEscape(t.description ?? ""),
            t.priority,
            t.group ?? "",
            t.dueDate ? t.dueDate.toISOString() : "",
            t.completed,
            t.recurrence ?? "",
            t.createdAt.toISOString(),
          ].join(",")
        );
      }
      lines.push("");
    }

    // Habits CSV
    if (habits.length > 0) {
      lines.push("=== HABITS ===");
      lines.push("id,name,icon,frequency,archived,createdAt");
      for (const h of habits) {
        lines.push(
          [
            h.id,
            csvEscape(h.name),
            h.icon ?? "",
            h.frequency,
            h.archived,
            h.createdAt.toISOString(),
          ].join(",")
        );
      }
      lines.push("");

      lines.push("=== HABIT LOGS ===");
      lines.push("habitLogId,habitId,date,completed");
      for (const h of habits) {
        for (const log of (h as unknown as { logs: Array<{ id: string; habitId: string; date: Date; completed: boolean }> }).logs) {
          lines.push(
            [log.id, log.habitId, log.date.toISOString(), log.completed].join(",")
          );
        }
      }
      lines.push("");
    }

    // Expenses CSV
    if (expenses.length > 0) {
      lines.push("=== EXPENSES ===");
      lines.push("id,amount,category,note,date,createdAt");
      for (const e of expenses) {
        lines.push(
          [
            e.id,
            e.amount,
            e.category,
            csvEscape(e.note ?? ""),
            e.date.toISOString(),
            e.createdAt.toISOString(),
          ].join(",")
        );
      }
      lines.push("");
    }

    // Notes CSV
    if (notes.length > 0) {
      lines.push("=== NOTES ===");
      lines.push("id,title,content,tags,pinned,createdAt");
      for (const n of notes) {
        lines.push(
          [
            n.id,
            csvEscape(n.title ?? ""),
            csvEscape(n.content),
            csvEscape(n.tags.join(";")),
            n.pinned,
            n.createdAt.toISOString(),
          ].join(",")
        );
      }
      lines.push("");
    }

    // Moods CSV
    if (moods.length > 0) {
      lines.push("=== MOOD ENTRIES ===");
      lines.push("id,mood,energy,note,date");
      for (const m of moods) {
        lines.push(
          [
            m.id,
            m.mood,
            m.energy ?? "",
            csvEscape(m.note ?? ""),
            m.date.toISOString(),
          ].join(",")
        );
      }
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="command-center-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // JSON format
  const data = { exportedAt: new Date().toISOString(), tasks, habits, expenses, notes, moods };
  const json = JSON.stringify(data, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="command-center-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
