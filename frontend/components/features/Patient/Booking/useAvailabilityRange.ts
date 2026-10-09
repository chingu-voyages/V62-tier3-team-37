"use client";

import { useMemo } from "react";
import { shiftMonth, startOfDay, toIsoDate } from "@/lib/booking/schedule";
import { AVAILABILITY_RANGE_MAX_DAYS } from "@/types/appointment";

/**
 * The window the booking calendar asks availability for.
 *
 * Always a full, valid range ending at the end of the visible month and starting
 * today (or the 31-day limit, whichever is nearer), so:
 *
 * - the query is never disabled for a half-formed range, and
 * - paging to another month is a refetch under a new key rather than a new input
 *   format.
 */
export function useAvailabilityRange(month: Date): { from: string; to: string } {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const todayIso = toIsoDate(today);

    // Last day of `month`: shift forward one month, then step back one day.
    const nextMonth = shiftMonth(startOfDay(month), 1);
    const monthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0);
    const monthEndIso = toIsoDate(monthEnd);

    if (monthEndIso < todayIso) {
      // A month entirely in the past cannot be booked. Keep the range well-formed
      // so the query stays enabled; the calendar disables those days itself.
      return { from: todayIso, to: todayIso };
    }

    // Start as early as the API's inclusive limit allows, but never before today.
    const earliestAllowed = new Date(monthEnd);
    earliestAllowed.setDate(earliestAllowed.getDate() - (AVAILABILITY_RANGE_MAX_DAYS - 1));

    const from = earliestAllowed < today ? today : earliestAllowed;

    return { from: toIsoDate(from), to: monthEndIso };
  }, [month]);
}
