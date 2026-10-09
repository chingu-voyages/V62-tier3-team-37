"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelAppointment as cancelAppointmentRequest,
  rescheduleAppointment as rescheduleAppointmentRequest,
} from "@/lib/api/patient-appointments-client";
import { appointmentKeys, hcpKeys } from "@/lib/query-keys";
import type {
  Appointment,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

type AppointmentId = { id: number };

/**
 * `PATCH /patient/appointments/{appointment}/reschedule`.
 *
 * The response is authoritative: the backend refuses a start time outside the
 * clinician's availability, and refuses the change outright once the visit has
 * begun. The returned record is patched into the cache rather than the requested
 * one, so the screen can never show a time the backend did not accept.
 *
 * Availability is invalidated too - the old slot is free again and the new one is
 * taken, so both clinicians' slot lists are now wrong.
 */
export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & RescheduleAppointmentRequest>({
    mutationFn: ({ id, scheduled_start_at }) =>
      rescheduleAppointmentRequest(id, { scheduled_start_at }),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.details(appointment.id),
      });
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });
    },
  });
}

/**
 * `PATCH /patient/appointments/{appointment}/cancel`.
 *
 * Cancelling frees the slot as well as changing the status, which is why the
 * availability caches are invalidated here too.
 *
 * A cancellation that arrives after the visit started is rejected by the backend and
 * surfaced to the patient rather than being shown as if it succeeded.
 */
export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & CancelAppointmentRequest>({
    mutationFn: ({ id, reason }) => cancelAppointmentRequest(id, { reason }),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.details(appointment.id),
      });
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });
    },
  });
}
