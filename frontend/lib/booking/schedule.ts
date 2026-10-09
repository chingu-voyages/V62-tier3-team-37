import { formatClockTime } from "@/lib/format";

/**
 * Calendar primitives for booking a visit.
 *
 * Pure date maths for laying out a month, with no React. What a clinician is
 * actually free for is not derivable here - it is whatever
 * `GET /patient/hcps/{hcp}/availability` returns - so this module deliberately
 * owns no slot table and no opening-hours rule.
 */

/** Sunday-first, matching `Date#getDay()`. */
export const BOOKING_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

/**
 * `YYYY-MM-DD` for a date, read from its local calendar fields.
 *
 * Never `toISOString()`, which converts through UTC and can return the previous day
 * for anyone west of Greenwich - the exact bug that would make a patient book the
 * wrong day.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * One entry per grid cell of `month`, padded at the front so week 1 starts under
 * its weekday.
 *
 * Blanks stand in for the tail of the previous month; `monthCellKeys` turns the
 * position into a stable, unique key.
 */
export function monthCells(month: Date): (number | null)[] {
  const firstOfMonth = startOfMonth(month);
  const leadingBlanks = Array.from({ length: firstOfMonth.getDay() }, () => null);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return [...leadingBlanks, ...Array.from({ length: dayCount }, (_, index) => index + 1)];
}

/**
 * A stable key for each cell of `monthCells`, blanks included.
 *
 * Blanks are keyed by the ISO date they stand in for - the tail of the previous
 * month - so no two cells share a key and the key still survives the leading
 * count changing between months. Never the array index.
 */
export function monthCellKeys(month: Date): string[] {
  const firstOfMonth = startOfMonth(month);
  const leadingBlanks = firstOfMonth.getDay();

  return monthCells(month).map((day, index) =>
    day === null
      ? // A negative day rolls back into the previous month.
        toIsoDate(
          new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), index - leadingBlanks + 1),
        )
      : toIsoDate(new Date(month.getFullYear(), month.getMonth(), day)),
  );
}

/** `09:00` -> `9:00 AM`, for display only. The stored value stays `HH:mm`. */
export { formatClockTime };
