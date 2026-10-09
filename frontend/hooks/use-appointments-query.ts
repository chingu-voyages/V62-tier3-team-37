"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  APPOINTMENTS_PAGE_SIZE,
  fetchAppointment,
  fetchAppointments,
} from "@/lib/api/patient-appointments-client";
import { appointmentKeys } from "@/lib/query-keys";

/**
 * The patient's own appointments, one page at a time.
 *
 * The API owns who owns the list, so there is no ownership input here - the
 * session cookie is the whole scope. `page` is the only variable.
 */
export function useAppointmentsQuery(page: number, perPage: number = APPOINTMENTS_PAGE_SIZE) {
  return useQuery({
    queryKey: appointmentKeys.list(page),
    queryFn: () => fetchAppointments(page, perPage),
    // Keeps the current page on screen while the next one loads, so paging does not
    // collapse the list back into a skeleton and lose the reader's place.
    placeholderData: keepPreviousData,
  });
}

/**
 * One appointment in full.
 *
 * Disabled until an id is known, because the dialog that reads it is mounted before
 * a row is chosen. `placeholderData` is deliberately absent: showing the previous
 * appointment while a new one loads would put the wrong doctor and time on screen,
 * which is worse than a brief skeleton.
 */
export function useAppointmentQuery(id: number | null) {
  return useQuery({
    queryKey: appointmentKeys.details(id ?? 0),
    queryFn: () => {
      if (id === null) throw new Error("An appointment id is required.");
      return fetchAppointment(id);
    },
    enabled: id !== null,
    // A cancelled or rescheduled visit changes what the detail dialog shows, and it
    // is written by a different action than the one that opened it.
    staleTime: 15 * 1000,
  });
}
