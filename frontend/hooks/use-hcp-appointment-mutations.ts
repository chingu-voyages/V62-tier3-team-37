"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelHcpAppointment,
  rescheduleHcpAppointment,
  setHcpAttendanceStatus,
  summariseHcpAppointment,
  uploadAppointmentResult,
} from "@/lib/api/hcp-appointments-client";
import { hcpAppointmentKeys, hcpKeys } from "@/lib/query-keys";
import type {
  Appointment,
  AppointmentStatus,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

type AppointmentId = { id: number };

/** What the action dialog collects before it knows which endpoint to call. */
export type HcpAppointmentAction = AppointmentId & {
  /** The status the clinician chose. */
  target: AppointmentStatus;
  /** Required for CANCELLED, ignored otherwise. */
  reason?: string;
  /** Required for RESCHEDULED. */
  slot?: { startAt: string };
  /** Required for COMPLETED. */
  summary?: string;
  /** Optional result document, only accepted when completing. */
  document?: File | null;
  /** Needed to avoid re-sending attendance for a visit that is already arrived. */
  currentStatus: AppointmentStatus;
};

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

/** `POST /hcp/appointments/{appointment}/reschedule`. */
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

/** `POST /hcp/appointments/{appointment}/cancel`. */
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
 * `POST /hcp/appointments/{appointment}/status`.
 *
 * Records attendance - ARRIVED or NO_SHOW. Only valid from BOOKED or RESCHEDULED,
 * so it is offered before a summary rather than after.
 */
export function useHcpAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & { status: "ARRIVED" | "NO_SHOW" }>({
    mutationFn: ({ id, status }) => setHcpAttendanceStatus(id, status),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
    },
  });
}

/**
 * `POST /hcp/appointments/{appointment}/summary`.
 *
 * The closing note, and what actually moves an ARRIVED visit to COMPLETED. Takes a
 * body, unlike the `complete` action it replaces, which is why the dialog is a
 * form rather than a confirmation.
 */
export function useSummariseHcpAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, AppointmentId & { summary: string }>({
    mutationFn: ({ id, summary }) => summariseHcpAppointment(id, summary),

    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
    },
  });
}

/**
 * The one write behind the action dialog: pick a status, apply it.
 *
 * COMPLETED is the awkward one. The API only lets a visit be summarised once it
 * has ARRIVED, so closing a still-BOOKED visit means marking attendance first and
 * then summarising. Both calls are sequenced here so the dialog offers every status
 * without the user having to know about that rule, and so a failure in either step
 * leaves the visit in a state the UI can still act on.
 *
 * A result document rides along with the completion when one was chosen: the
 * endpoint accepts ARRIVED as well as COMPLETED, so it goes after the summary.
 * A failed upload is deliberately *not* fatal - the visit is already closed and
 * that cannot be undone, so the note is reported as saved with the document missing
 * rather than being rolled back into an error the user cannot retry.
 */
export function useHcpAppointmentActionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { appointment: Appointment; documentUploaded: boolean },
    unknown,
    HcpAppointmentAction
  >({
    mutationFn: async (action) => {
      const { id, target, reason, slot, summary, document } = action;

      if (target === "CANCELLED") {
        return {
          appointment: await cancelHcpAppointment(id, { reason }),
          documentUploaded: false,
        };
      }

      if (target === "RESCHEDULED") {
        if (!slot) throw new Error("Pick a slot to move this visit to.");
        return {
          appointment: await rescheduleHcpAppointment(id, {
            scheduled_start_at: slot.startAt,
          }),
          documentUploaded: false,
        };
      }

      if (target === "NO_SHOW") {
        return {
          appointment: await setHcpAttendanceStatus(id, "NO_SHOW"),
          documentUploaded: false,
        };
      }

      // COMPLETED. Arriving first is a no-op on a visit that is already arrived.
      const arrived =
        action.currentStatus === "ARRIVED" ? null : await setHcpAttendanceStatus(id, "ARRIVED");

      const closed = await summariseHcpAppointment(id, summary ?? "");

      if (!document) {
        return { appointment: closed, documentUploaded: false };
      }

      try {
        await uploadAppointmentResult(id, document);
        return { appointment: closed, documentUploaded: true };
      } catch {
        return { appointment: closed ?? arrived, documentUploaded: false };
      }
    },

    onSuccess: ({ appointment }) => {
      void queryClient.invalidateQueries({ queryKey: hcpAppointmentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: hcpAppointmentKeys.details(appointment.id),
      });
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });
    },
  });
}
