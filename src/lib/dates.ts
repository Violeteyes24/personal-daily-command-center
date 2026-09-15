/**
 * Calendar-date helpers.
 *
 * Expense, HabitLog, MoodEntry and BudgetGoal all store `@db.Date` columns —
 * calendar days, not instants. Postgres takes the *UTC* date part of whatever
 * JS Date it is handed, so a local Date built in UTC+8 silently rolls back a
 * day: `new Date(2026, 8, 15, 7, 0)` in Manila serialises to 2026-09-14T23:00Z
 * and lands on September 14.
 *
 * Every calendar day in this app is therefore represented as a Date pinned to
 * UTC midnight. Build them here, never with `new Date(y, m, d)`.
 */

/** Days in a given month. `month` is 1-12. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Collapse any Date (or ISO / `YYYY-MM-DD` string) to UTC midnight of the
 * calendar day the user means.
 *
 * A `Date` is read in the *local* calendar, because that is the day the user
 * picked in the date picker. A bare `YYYY-MM-DD` string is already a calendar
 * day and is taken literally.
 */
export function toCalendarDate(value: Date | string): Date {
  if (typeof value === "string") {
    const bare = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (bare) {
      return new Date(Date.UTC(+bare[1], +bare[2] - 1, +bare[3]));
    }
    return toCalendarDate(new Date(value));
  }

  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  );
}

/** `YYYY-MM-DD` for a calendar date. Stable regardless of the server timezone. */
export function formatCalendarDate(value: Date | string): string {
  return toCalendarDate(value).toISOString().slice(0, 10);
}

/**
 * Inclusive first/last day of a month, as UTC-midnight calendar dates.
 * `month` is 1-12.
 *
 * The previous code used `new Date(y, m + 1, 0)`, which in UTC+8 produced
 * 2026-09-29 for September — quietly dropping the last day of every month.
 */
export function monthRange(
  year: number,
  month: number
): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month - 1, daysInMonth(year, month))),
  };
}

/** The month a calendar date falls in, as `{ year, month }` with month 1-12. */
export function monthOf(value: Date | string): { year: number; month: number } {
  const d = toCalendarDate(value);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** First day of the month a date falls in — the shape `BudgetGoal.month` stores. */
export function monthStart(value: Date | string): Date {
  const { year, month } = monthOf(value);
  return monthRange(year, month).start;
}

/** Inclusive start/end for a single calendar day. */
export function dayRange(value: Date | string): { start: Date; end: Date } {
  const day = toCalendarDate(value);
  return { start: day, end: day };
}

/** Today, as a calendar date in the running environment's local timezone. */
export function today(): Date {
  return toCalendarDate(new Date());
}

/**
 * Add days to a calendar date.
 */
export function addDays(value: Date | string, days: number): Date {
  const d = toCalendarDate(value);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days)
  );
}

/**
 * Add months, clamping the day to the target month's length.
 *
 * `Date.setMonth` overflows instead of clamping: Jan 31 + 1 month gives
 * March 3, which made February unreachable in the month picker and skipped it
 * for monthly recurring items.
 */
export function addMonthsClamped(value: Date | string, months: number): Date {
  const d = toCalendarDate(value);
  const targetMonthIndex = d.getUTCMonth() + months;
  const year = d.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const monthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const day = Math.min(d.getUTCDate(), daysInMonth(year, monthIndex + 1));

  return new Date(Date.UTC(year, monthIndex, day));
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function differenceInCalendarDays(
  to: Date | string,
  from: Date | string
): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round(
    (toCalendarDate(to).getTime() - toCalendarDate(from).getTime()) / MS_PER_DAY
  );
}

/**
 * Parse a `YYYY-MM` URL param. Returns null when absent or malformed, so
 * callers fall back to the current month.
 *
 * Replaces `parse(param, "yyyy-MM", new Date())`, which inherited today's
 * day-of-month from the reference date and overflowed on the 29th-31st.
 */
export function parseMonthParam(
  value: string | undefined | null
): { year: number; month: number } | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { year, month };
}

/** `YYYY-MM` for use in URLs. `month` is 1-12. */
export function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
