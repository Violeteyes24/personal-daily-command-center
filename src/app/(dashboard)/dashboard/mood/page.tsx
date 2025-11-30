import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOOD_LEVELS } from "@/constants/categories";

export default function MoodPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mood</h1>
        <p className="text-muted-foreground">
          Track how you&apos;re feeling and spot patterns.
        </p>
      </div>

      {/* Today's Check-in */}
      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            {MOOD_LEVELS.map((level) => (
              <button
                key={level.value}
                className="flex flex-col items-center gap-2 rounded-lg p-4 transition-colors hover:bg-muted"
              >
                <span className="text-4xl">{level.emoji}</span>
                <span className="text-sm text-muted-foreground">
                  {level.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mood History */}
      <Card>
        <CardHeader>
          <CardTitle>Mood History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-lg">No mood entries yet</p>
            <p className="text-sm">Check in daily to see trends</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
