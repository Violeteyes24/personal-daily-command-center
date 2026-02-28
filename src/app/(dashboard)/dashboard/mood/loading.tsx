import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MoodLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-28" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Today's check-in card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>

      {/* History */}
      <Skeleton className="h-5 w-24" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
