/**
 * Regression tests for the three date bugs confirmed in the expense tracker.
 *
 *   node --test src/lib/dates.test.mjs
 *
 * Run under a UTC+8 clock to reproduce the original failures:
 *   TZ=Asia/Manila node --test src/lib/dates.test.mjs
 *
 * This file is .mjs rather than .ts so it runs on plain Node with no build
 * step or test framework — the repo has neither.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  addMonthsClamped,
  dayRange,
  differenceInCalendarDays,
  formatCalendarDate,
  formatMonthParam,
  monthOf,
  monthRange,
  monthStart,
  parseMonthParam,
  toCalendarDate,
} from "./dates.ts";

test("B1: an expense logged at 07:00 in UTC+8 keeps its own date", () => {
  // The exact case that used to save to September 14.
  const morningInManila = new Date("2026-09-15T07:00:00+08:00");
  assert.equal(formatCalendarDate(morningInManila), "2026-09-15");
});

test("B1: local midnight and late evening stay on the same calendar day", () => {
  const localMidnight = new Date(2026, 8, 15, 0, 0, 0);
  const lateEvening = new Date(2026, 8, 15, 23, 59, 59);

  assert.equal(formatCalendarDate(localMidnight), "2026-09-15");
  assert.equal(formatCalendarDate(lateEvening), "2026-09-15");
});

test("B1: calendar dates are pinned to UTC midnight", () => {
  const d = toCalendarDate(new Date(2026, 8, 15, 7, 0, 0));
  assert.equal(d.toISOString(), "2026-09-15T00:00:00.000Z");
});

test("B1: bare YYYY-MM-DD strings are taken literally", () => {
  assert.equal(formatCalendarDate("2026-09-15"), "2026-09-15");
});

test("B2: a month range covers its first and last day inclusively", () => {
  const { start, end } = monthRange(2026, 9);
  assert.equal(formatCalendarDate(start), "2026-09-01");
  assert.equal(formatCalendarDate(end), "2026-09-30"); // was 2026-09-29
});

test("B2: the previous month's last day is excluded", () => {
  const { start } = monthRange(2026, 9);
  assert.equal(formatCalendarDate(start), "2026-09-01"); // was 2026-08-31
});

test("B2: February handles leap and non-leap years", () => {
  assert.equal(formatCalendarDate(monthRange(2024, 2).end), "2024-02-29");
  assert.equal(formatCalendarDate(monthRange(2026, 2).end), "2026-02-28");
});

test("B2: every month reports its real length", () => {
  const lengths = Array.from({ length: 12 }, (_, i) =>
    monthRange(2026, i + 1).end.getUTCDate()
  );
  assert.deepEqual(lengths, [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
});

test("B3: stepping forward from Jan 31 lands in February, not March", () => {
  const result = addMonthsClamped(new Date(2026, 0, 31), 1);
  assert.equal(formatCalendarDate(result), "2026-02-28"); // was 2026-03-03
});

test("B3: stepping backward from Mar 31 lands in February", () => {
  const result = addMonthsClamped(new Date(2026, 2, 31), -1);
  assert.equal(formatCalendarDate(result), "2026-02-28");
});

test("B3: month navigation reaches every month when run on the 31st", () => {
  // Walk a year forward from Jan 31 and assert no month is skipped.
  let cursor = toCalendarDate(new Date(2026, 0, 31));
  const visited = [];
  for (let i = 0; i < 12; i++) {
    visited.push(monthOf(cursor).month);
    cursor = addMonthsClamped(cursor, 1);
  }
  assert.deepEqual(visited, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("B3: month arithmetic crosses year boundaries", () => {
  assert.equal(formatCalendarDate(addMonthsClamped("2026-12-15", 1)), "2027-01-15");
  assert.equal(formatCalendarDate(addMonthsClamped("2026-01-15", -1)), "2025-12-15");
  assert.equal(formatCalendarDate(addMonthsClamped("2026-01-31", -14)), "2024-11-30");
});

test("parseMonthParam ignores the current date entirely", () => {
  assert.deepEqual(parseMonthParam("2026-02"), { year: 2026, month: 2 });
  assert.deepEqual(parseMonthParam("2026-2"), { year: 2026, month: 2 });
});

test("parseMonthParam rejects junk instead of guessing", () => {
  for (const bad of [undefined, null, "", "nope", "2026", "2026-13", "2026-00"]) {
    assert.equal(parseMonthParam(bad), null, `expected null for ${String(bad)}`);
  }
});

test("formatMonthParam round-trips through parseMonthParam", () => {
  assert.equal(formatMonthParam(2026, 9), "2026-09");
  assert.deepEqual(parseMonthParam(formatMonthParam(2026, 9)), {
    year: 2026,
    month: 9,
  });
});

test("monthStart normalises any day to the first of its month", () => {
  assert.equal(formatCalendarDate(monthStart("2026-09-30")), "2026-09-01");
});

test("B6: a day range is a single day, not two", () => {
  const { start, end } = dayRange("2026-09-15");
  assert.equal(formatCalendarDate(start), "2026-09-15");
  assert.equal(formatCalendarDate(end), "2026-09-15");
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(formatCalendarDate(addDays("2026-09-30", 1)), "2026-10-01");
  assert.equal(formatCalendarDate(addDays("2026-01-01", -1)), "2025-12-31");
});

test("differenceInCalendarDays counts whole days", () => {
  assert.equal(differenceInCalendarDays("2026-09-30", "2026-09-01"), 29);
  assert.equal(differenceInCalendarDays("2026-09-01", "2026-09-30"), -29);
  assert.equal(differenceInCalendarDays("2026-09-15", "2026-09-15"), 0);
});
