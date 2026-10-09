import { ApiError, apiRequest } from "@/lib/api/client";
import type { CreateAppointmentRequest, CreateAppointmentResponse } from "@/types/appointment";

const APPOINTMENTS_ENDPOINT = "/api/patient/appointments";

/**
 * `POST /api/patient/appointments`.
 *
 * One endpoint serves both SELF and OTHER bookings; the `booking_for` member of
 * the discriminated union decides which body shape is sent, so a SELF request
 * cannot accidentally carry an `attendee`.
 *
 * Errors are not swallowed. `ApiError` keeps the HTTP status and Laravel's
 * field-level `errors`, which the booking form maps back onto its inputs. The
 * backend stays authoritative on the result: nothing here derives an end time or
 * assumes the appointment was confirmed.
 */
export function createAppointment(
  request: CreateAppointmentRequest,
): Promise<CreateAppointmentResponse> {
  return apiRequest<CreateAppointmentResponse>(APPOINTMENTS_ENDPOINT, {
    method: "POST",
    body: request,
  });
}

/**
 * HTTP 409 - someone else took the slot between the availability read and the
 * submit.
 *
 * Worth naming because the recovery differs from every other failure: the form
 * values are fine, the *slot* is gone, so the caller refreshes availability
 * rather than re-showing a validation error.
 */
export const SLOT_CONFLICT_STATUS = 409;

export function isSlotConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === SLOT_CONFLICT_STATUS;
}
