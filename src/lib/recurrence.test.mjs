/**
 * Recurrence scheduling tests.
 *
 *   npm test
 *
 * The materialiser runs on every page load, so the properties that matter are:
 * it never creates the same occurrence twice, it catches up after a gap, and
 * monthly series do not drift earlier when clamped to short months.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { formatCalendarDate } from "./dates.ts";
import {
  MAX_OCCURRENCES_PER_RUN,
  describeRecurrence,
  nextOccurrence,
  nextRunDate,
  occurrencesDue,
} from "./recurrence.ts";

const days = (list) => list.map(formatCalendarDate);

test("a new daily series starts on its start date", () => {
  const due = occurrencesDue({
    recurrence: "daily",
    startDate: "2026-09-01",
    lastRunOn: null,
    through: "2026-09-04",
  });
  assert.deepEqual(days(due), [
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
  ]);
});

test("nothing is due when the series is already up to date", () => {
  const due = occurrencesDue({
    recurrence: "daily",
    startDate: "2026-09-01",
    lastRunOn: "2026-09-04",
    through: "2026-09-04",
  });
  assert.deepEqual(days(due), []);
});

test("running twice in a row creates nothing the second time", () => {
  const first = occurrencesDue({
    recurrence: "monthly",
    startDate: "2026-07-15",
    lastRunOn: null,
    through: "2026-09-15",
  });
  assert.deepEqual(days(first), ["2026-07-15", "2026-08-15", "2026-09-15"]);

  const second = occurrencesDue({
    recurrence: "monthly",
    startDate: "2026-07-15",
    lastRunOn: first[first.length - 1],
    through: "2026-09-15",
  });
  assert.deepEqual(days(second), []);
});

test("a dormant series catches up on the next load", () => {
  const due = occurrencesDue({
    recurrence: "monthly",
    startDate: "2026-01-10",
    lastRunOn: "2026-06-10",
    through: "2026-09-10",
  });
  assert.deepEqual(days(due), ["2026-07-10", "2026-08-10", "2026-09-10"]);
});

test("monthly series anchored on the 31st do not drift earlier", () => {
  // Naive clamping gives Feb 28 -> Mar 28 -> Apr 28. Anchoring to the start
  // date keeps it on month ends.
  const due = occurrencesDue({
    recurrence: "monthly",
    startDate: "2026-01-31",
    lastRunOn: null,
    through: "2026-05-31",
  });
  assert.deepEqual(days(due), [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
    "2026-05-31",
  ]);
});

test("weekdays skips weekends", () => {
  // 2026-09-04 is a Friday.
  const due = occurrencesDue({
    recurrence: "weekdays",
    startDate: "2026-09-04",
    lastRunOn: null,
    through: "2026-09-08",
  });
  assert.deepEqual(days(due), ["2026-09-04", "2026-09-07", "2026-09-08"]);
});

test("a weekdays series starting on a Saturday begins on Monday", () => {
  const due = occurrencesDue({
    recurrence: "weekdays",
    startDate: "2026-09-05", // Saturday
    lastRunOn: null,
    through: "2026-09-08",
  });
  assert.deepEqual(days(due), ["2026-09-07", "2026-09-08"]);
});

test("weekly and biweekly step by 7 and 14 days", () => {
  assert.deepEqual(
    days(
      occurrencesDue({
        recurrence: "weekly",
        startDate: "2026-09-01",
        through: "2026-09-22",
      })
    ),
    ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22"]
  );

  assert.deepEqual(
    days(
      occurrencesDue({
        recurrence: "biweekly",
        startDate: "2026-09-01",
        through: "2026-09-29",
      })
    ),
    ["2026-09-01", "2026-09-15", "2026-09-29"]
  );
});

test("endDate stops the series", () => {
  const due = occurrencesDue({
    recurrence: "monthly",
    startDate: "2026-01-15",
    endDate: "2026-03-15",
    lastRunOn: null,
    through: "2026-09-15",
  });
  assert.deepEqual(days(due), ["2026-01-15", "2026-02-15", "2026-03-15"]);
});

test("a series that has not started yet produces nothing", () => {
  const due = occurrencesDue({
    recurrence: "daily",
    startDate: "2026-10-01",
    through: "2026-09-15",
  });
  assert.deepEqual(days(due), []);
});

test("a very old series is capped rather than generating unbounded rows", () => {
  const due = occurrencesDue({
    recurrence: "daily",
    startDate: "2000-01-01",
    through: "2026-09-15",
  });
  assert.equal(due.length, MAX_OCCURRENCES_PER_RUN);
});

test("nextRunDate reports the upcoming date, or null once finished", () => {
  assert.equal(
    formatCalendarDate(
      nextRunDate({
        recurrence: "monthly",
        startDate: "2026-01-15",
        lastRunOn: "2026-09-15",
        today: "2026-09-20",
      })
    ),
    "2026-10-15"
  );

  assert.equal(
    nextRunDate({
      recurrence: "monthly",
      startDate: "2026-01-15",
      endDate: "2026-09-15",
      lastRunOn: "2026-09-15",
      today: "2026-09-20",
    }),
    null
  );
});

test("nextOccurrence is always strictly later than its input", () => {
  for (const kind of ["daily", "weekdays", "weekly", "biweekly", "monthly"]) {
    const from = "2026-09-15";
    const next = nextOccurrence(from, kind, from);
    assert.ok(
      formatCalendarDate(next) > from,
      `${kind} produced ${formatCalendarDate(next)}`
    );
  }
});

test("describeRecurrence reads naturally", () => {
  assert.equal(describeRecurrence("daily", "2026-09-15"), "Every day");
  assert.equal(describeRecurrence("weekdays", "2026-09-15"), "Every weekday");
  assert.equal(describeRecurrence("monthly", "2026-09-01"), "Monthly on the 1st");
  assert.equal(describeRecurrence("monthly", "2026-09-02"), "Monthly on the 2nd");
  assert.equal(describeRecurrence("monthly", "2026-09-03"), "Monthly on the 3rd");
  assert.equal(describeRecurrence("monthly", "2026-09-11"), "Monthly on the 11th");
  assert.equal(
    describeRecurrence("monthly", "2026-01-31"),
    "Monthly on the 31st (or month end)"
  );
});
