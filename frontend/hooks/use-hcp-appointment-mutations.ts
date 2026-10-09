"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelHcpAppointment,
  completeHcpAppointment,
  rescheduleHcpAppointment,
} from "@/lib/api/hcp-appointments-client";
import { hcpAppointmentKeys, hcpKeys } from "@/lib/query-keys";
import type {
  Appointment,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

type AppointmentId = { id: number };

/**
 * The three writes a clinician can make, and what each one invalidates.
 *
 * The response is authoritative in every case: the backend owns the status machine
 * and refuses anything out of order, so the record it returns - not the requested one
 * - is what the cache is reconciled from.
 *
 * Availability is invalidated on reschedule and cancel because both free and take
 * slots: the old one becomes bookable and the new one is gone, so every cached
 * availability list for this clinic is now wrong.
 */

/** `PATCH /hcp/appointments/{appointment}/reschedule`. */
export function useRescheduleHcpAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & RescheduleAppointmentRequest>({
    mutationFn: ({ id, scheduled_start_at }) =>
      rescheduleHcpAppointment(id, { scheduled_start_at }),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });
    },
  });
}

/** `PATCH /hcp/appointments/{appointment}/cancel`. */
export function useCancelHcpAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & CancelAppointmentRequest>({
    mutationFn: ({ id, reason }) => cancelHcpAppointment(id, { reason }),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });
    },
  });
}

/**
 * `PATCH /hcp/appointments/{appointment}/complete`.
 *
 * The only one of the three that takes no body: the clinician asserts the visit
 * happened, and the backend refuses it before the visit has ended.
 */
export function useCompleteHcpAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId>({
    mutationFn: ({ id }) => completeHcpAppointment(id),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
    },
  });
}
