"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/appointments-contract";
import { fetchHcpAppointment, fetchHcpAppointments } from "@/lib/api/hcp-appointments-client";
import { hcpAppointmentKeys } from "@/lib/query-keys";
import { type HcpAppointmentView, statusesForHcpView } from "@/types/appointment";

/**
 * One workflow stage of the clinician's own appointments, one page at a time.
 *
 * The view is part of the cache key, not a client-side filter over one shared list:
 * each tab is a different question to the API, so "page 3 of History" and "page 3
 * of Upcoming" are different rows and must never overwrite each other in the cache.
 *
 * `placeholderData` keeps the previous tab's rows on screen while the new ones load,
 * so switching does not collapse the list back to a skeleton.
 */
export function useHcpAppointmentsQuery(
  view: HcpAppointmentView,
  page: number,
  perPage: number = APPOINTMENTS_PAGE_SIZE,
) {
  const statuses = statusesForHcpView(view);

  return useQuery({
    queryKey: [...hcpAppointmentKeys.list(page), view],
    queryFn: () => fetchHcpAppointments(statuses, page, perPage),
    placeholderData: keepPreviousData,
  });
}

/**
 * One appointment in full.
 *
 * Disabled until an id is known, because the dialog that reads it is mounted before
 * a row is chosen. `placeholderData` is deliberately absent: showing the previous
 * patient while a new one loads would put the wrong identity and time on screen,
 * which is worse than a brief skeleton.
 */
export function useHcpAppointmentQuery(id: number | null) {
  return useQuery({
    queryKey: hcpAppointmentKeys.details(id ?? 0),
    queryFn: () => {
      if (id === null) throw new Error("An appointment id is required.");
      return fetchHcpAppointment(id);
    },
    enabled: id !== null,
    // Cancelling, rescheduling or completing changes what the detail dialog shows,
    // and it is written by a different action than the one that opened it.
    staleTime: 15 * 1000,
  });
}
