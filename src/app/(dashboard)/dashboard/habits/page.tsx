import { getHabits } from "@/actions/habits";
import { HabitsClient } from "@/components/habits";

export default async function HabitsPage() {
  const result = await getHabits();
  const habits = result.success ? result.data ?? [] : [];

  return <HabitsClient initialHabits={habits} />;
}
