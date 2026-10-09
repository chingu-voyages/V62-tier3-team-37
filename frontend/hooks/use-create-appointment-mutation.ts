"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAppointment } from "@/lib/api/patient-appointments-client";
import { appointmentKeys, hcpKeys } from "@/lib/query-keys";
import type { CreateAppointmentRequest, CreateAppointmentResponse } from "@/types/appointment";

/**
 * `POST /patient/appointments`, for both SELF and OTHER bookings.
 *
 * The request type is a discriminated union, so the caller cannot send an
 * `attendee` with `booking_for: "SELF"` or omit one with `"OTHER"` - the choice is
 * made in the types rather than validated at the boundary.
 *
 * Errors are left intact: `ApiError` carries the status and Laravel's field
 * errors, which the booking form maps back onto its inputs. In particular a 409 is
 * *not* retried, because the slot is gone and re-sending would only fail again.
 *
 * There is deliberately no optimistic insert and no cache edit: booking is a
 * single authoritative write, and the returned appointment is the result.
 */
export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateAppointmentResponse, unknown, CreateAppointmentRequest>({
    mutationFn: (request) => createAppointment(request),
    onSuccess: () => {
      // The booked slot is now taken, so the availability snapshot for that
      // clinician is out of date. Every availability read is invalidated rather
      // than one exact key: the patient may have paged through several ranges, and
      // the backend is the authority on what is still free.
      void queryClient.invalidateQueries({ queryKey: hcpKeys.availabilities() });

      // The new booking belongs in "Your appointments", so every page of that list is
      // stale. `lists()` rather than one exact key: the patient may be on any page.
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
