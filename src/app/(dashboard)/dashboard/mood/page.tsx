import { getMoodEntries, getTodayMood } from "@/actions/mood";
import { MoodClient } from "@/components/mood";

export default async function MoodPage() {
  const [entriesResult, todayResult] = await Promise.all([
    getMoodEntries(),
    getTodayMood(),
  ]);

  const entries = entriesResult.success ? (entriesResult.data ?? []) : [];
  const todayMood = todayResult.success ? (todayResult.data ?? null) : null;

  return (
    <MoodClient initialEntries={entries} todayMood={todayMood} />
  );
}
