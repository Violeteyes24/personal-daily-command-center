import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Search across all entities in parallel
  const [tasks, notes, habits, expenses] = await Promise.all([
    db.task.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, completed: true, priority: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    db.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, pinned: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    db.habit.findMany({
      where: {
        userId,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, icon: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.expense.findMany({
      where: {
        userId,
        OR: [
          { note: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, note: true, amount: true, category: true },
      take: 5,
      orderBy: { date: "desc" },
    }),
  ]);

  const results = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t.completed ? "✅" : "⬜"} ${t.priority} priority task`,
      type: "task" as const,
      href: "/dashboard/tasks",
    })),
    ...notes.map((n) => ({
      id: n.id,
      title: n.title || "Untitled note",
      subtitle: n.pinned ? "📌 Pinned note" : "Note",
      type: "note" as const,
      href: "/dashboard/notes",
    })),
    ...habits.map((h) => ({
      id: h.id,
      title: `${h.icon ?? "🔄"} ${h.name}`,
      subtitle: "Habit",
      type: "habit" as const,
      href: "/dashboard/habits",
    })),
    ...expenses.map((e) => ({
      id: e.id,
      title: e.note || e.category,
      subtitle: `$${Number(e.amount).toFixed(2)} · ${e.category}`,
      type: "expense" as const,
      href: "/dashboard/expenses",
    })),
  ];

  return NextResponse.json({ results });
}
