"use client";

import { RouteError } from "@/components/shared/route-error";

export default function ExpensesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Failed to load expenses" />;
}
