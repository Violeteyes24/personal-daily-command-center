/**
 * Recurrence scheduling, kept free of Prisma and Clerk so it can be tested
 * directly with `node --test`.
 */
import { addDays, addMonthsClamped, differenceInCalendarDays, toCalendarDate } from "@/lib/dates";

export type RecurrenceKind =
  | "daily"
  | "weekdays"
  | "weekly"
  | "biweekly"
  | "monthly";

/** Saturday or Sunday in the calendar (UTC) frame. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * The next occurrence strictly after `from`.
 *
 * `anchor` is the series start date — monthly recurrences count from it so a
 * series starting on the 31st keeps landing on month ends rather than drifting
 * earlier each time it is clamped.
 */
export function nextOccurrence(
  from: Date | string,
  recurrence: RecurrenceKind,
  anchor: Date | string
): Date {
  const current = toCalendarDate(from);

  switch (recurrence) {
    case "daily":
      return addDays(current, 1);

    case "weekdays": {
      let next = addDays(current, 1);
      while (isWeekend(next)) next = addDays(next, 1);
      return next;
    }

    case "weekly":
      return addDays(current, 7);

    case "biweekly":
      return addDays(current, 14);

    case "monthly": {
      // Step from the anchor so repeated clamping cannot walk the date
      // backwards (31st -> Feb 28 -> Mar 28 instead of Mar 31).
      const start = toCalendarDate(anchor);
      let months = 1;
      let candidate = addMonthsClamped(start, months);
      while (candidate.getTime() <= current.getTime()) {
        months += 1;
        candidate = addMonthsClamped(start, months);
      }
      return candidate;
    }
  }
}

export interface ScheduleInput {
  recurrence: RecurrenceKind;
  startDate: Date | string;
  endDate?: Date | string | null;
  /** Last date already materialised; null when nothing has run yet. */
  lastRunOn?: Date | string | null;
  /** Generate occurrences up to and including this date. */
  through: Date | string;
}

/** Hard ceiling so a long-dormant series cannot generate unbounded rows. */
export const MAX_OCCURRENCES_PER_RUN = 120;

/**
 * Every occurrence that should exist by `through` but has not been created yet.
 *
 * Returns `[]` when the series is up to date, which makes calling this on every
 * page load cheap and idempotent.
 */
export function occurrencesDue(input: ScheduleInput): Date[] {
  const { recurrence, through } = input;
  const start = toCalendarDate(input.startDate);
  const limit = toCalendarDate(through);
  const end = input.endDate ? toCalendarDate(input.endDate) : null;

  const ceiling = end && end.getTime() < limit.getTime() ? end : limit;
  if (ceiling.getTime() < start.getTime()) return [];

  const due: Date[] = [];
  let cursor: Date;

  if (input.lastRunOn) {
    const last = toCalendarDate(input.lastRunOn);
    if (last.getTime() >= ceiling.getTime()) return [];
    cursor = nextOccurrence(last, recurrence, start);
  } else {
    // "weekdays" starting on a weekend begins on the following Monday.
    cursor = recurrence === "weekdays" && isWeekend(start)
      ? nextOccurrence(start, recurrence, start)
      : start;
  }

  while (
    cursor.getTime() <= ceiling.getTime() &&
    due.length < MAX_OCCURRENCES_PER_RUN
  ) {
    due.push(cursor);
    cursor = nextOccurrence(cursor, recurrence, start);
  }

  return due;
}

/** The next date this series will fire, or null once it has finished. */
export function nextRunDate(input: {
  recurrence: RecurrenceKind;
  startDate: Date | string;
  endDate?: Date | string | null;
  lastRunOn?: Date | string | null;
  today: Date | string;
}): Date | null {
  const start = toCalendarDate(input.startDate);
  const end = input.endDate ? toCalendarDate(input.endDate) : null;

  let candidate: Date;
  if (input.lastRunOn) {
    candidate = nextOccurrence(input.lastRunOn, input.recurrence, start);
  } else {
    candidate =
      input.recurrence === "weekdays" && isWeekend(start)
        ? nextOccurrence(start, input.recurrence, start)
        : start;
  }

  if (end && candidate.getTime() > end.getTime()) return null;
  return candidate;
}

/** Human summary for the UI, e.g. "Monthly on the 15th". */
export function describeRecurrence(
  recurrence: RecurrenceKind,
  startDate: Date | string
): string {
  const start = toCalendarDate(startDate);

  switch (recurrence) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Every weekday";
    case "weekly":
    case "biweekly": {
      const weekday = new Intl.DateTimeFormat("en-PH", {
        weekday: "long",
        timeZone: "UTC",
      }).format(start);
      return recurrence === "weekly"
        ? `Every ${weekday}`
        : `Every 2 weeks on ${weekday}`;
    }
    case "monthly": {
      const day = start.getUTCDate();
      const suffix =
        day % 10 === 1 && day !== 11
          ? "st"
          : day % 10 === 2 && day !== 12
            ? "nd"
            : day % 10 === 3 && day !== 13
              ? "rd"
              : "th";
      return day >= 29
        ? `Monthly on the ${day}${suffix} (or month end)`
        : `Monthly on the ${day}${suffix}`;
    }
  }
}

export { differenceInCalendarDays };
