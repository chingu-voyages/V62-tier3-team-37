"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/appointments-contract";
import { fetchHcpAppointment, fetchHcpAppointments } from "@/lib/api/hcp-appointments-client";
import { hcpAppointmentKeys } from "@/lib/query-keys";

/**
 * The clinician's own appointments, one page at a time.
 *
 * The API owns the scope, so there is no owner input here - the session cookie is
 * the whole thing, and `page` is the only variable. The `hcp.verified` gate answers a
 * 403 for an unverified account, which the screen reports as a state to explain
 * rather than as a fault to retry.
 */
export function useHcpAppointmentsQuery(page: number, perPage: number = APPOINTMENTS_PAGE_SIZE) {
  return useQuery({
    queryKey: hcpAppointmentKeys.list(page),
    queryFn: () => fetchHcpAppointments(page, perPage),
    // Keeps the current page on screen while the next one loads, so paging does not
    // collapse the list back into a skeleton and lose the clinician's place.
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
