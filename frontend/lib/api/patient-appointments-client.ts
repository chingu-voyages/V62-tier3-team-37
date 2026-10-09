import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/appointments-contract";
import { apiRequest } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentPageResponse,
  CancelAppointmentRequest,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

const APPOINTMENTS_ENDPOINT = "/api/patient/appointments";

/**
 * Rows per request.
 *
 * Fifteen is the backend's own `paginate()` default, so leaving it unset would
 * give the same page anyway - it is passed explicitly so the client and the
 * controller cannot drift apart unnoticed.
 */
export {
  APPOINTMENTS_PAGE_SIZE,
  isSlotConflict,
  SLOT_CONFLICT_STATUS,
} from "@/lib/api/appointments-contract";

/** One page of the patient's own appointments. */
export type AppointmentsPage = {
  appointments: Appointment[];
  currentPage: number;
  totalPages: number;
  total: number;
};

/**
 * `GET /api/patient/appointments`.
 *
 * Scoped server-side to the authenticated patient: the controller reads
 * `$request->user()->patientAppointments()`, so a patient can never read someone
 * else's visits by changing the request.
 *
 * Newest-first, as the controller orders it. Grouping into upcoming/past is left
 * to the caller rather than done here, because "past" depends on the current time
 * and the backend deliberately does not make that judgement.
 */
export function fetchAppointments(
  page = 1,
  perPage: number = APPOINTMENTS_PAGE_SIZE,
): Promise<AppointmentsPage> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  return apiRequest<AppointmentPageResponse>(`${APPOINTMENTS_ENDPOINT}?${params.toString()}`).then(
    (response) => ({
      appointments: response.data,
      currentPage: response.meta.current_page,
      totalPages: response.meta.last_page,
      total: response.meta.total,
    }),
  );
}

/**
 * `GET /api/patient/appointments/{appointment}`.
 *
 * Used for the detail dialog rather than reading the row already in the cache: the
 * list is a paginated projection, so it may not hold the appointment being opened,
 * and the controller re-reads it with the patient's ownership constraint applied.
 *
 * A 404 from this endpoint means "not yours, or gone". Both are the same thing to
 * the caller, so the error is surfaced rather than retried.
 */
export function fetchAppointment(id: number): Promise<Appointment> {
  return apiRequest<{ data: Appointment }>(`${APPOINTMENTS_ENDPOINT}/${id}`).then(
    (response) => response.data,
  );
}

/**
 * `PATCH /api/patient/appointments/{appointment}/reschedule`.
 *
 * The new start must carry an explicit offset or `Z`; the backend rejects a
 * timezone-less timestamp with a 422. The backend also refuses a slot outside the
 * clinician's availability and any reschedule after the visit has started, so the
 * returned appointment - not the requested one - is the result.
 */
export function rescheduleAppointment(
  id: number,
  request: RescheduleAppointmentRequest,
): Promise<Appointment> {
  return apiRequest<{ data: Appointment }>(`${APPOINTMENTS_ENDPOINT}/${id}/reschedule`, {
    method: "PATCH",
    body: request,
  }).then((response) => response.data);
}

/**
 * `PATCH /api/patient/appointments/{appointment}/cancel`.
 *
 * `reason` is optional. Cancellation is refused once the visit has started, which
 * is a business rule only the backend knows.
 */
export function cancelAppointment(
  id: number,
  request: CancelAppointmentRequest = {},
): Promise<Appointment> {
  return apiRequest<{ data: Appointment }>(`${APPOINTMENTS_ENDPOINT}/${id}/cancel`, {
    method: "PATCH",
    body: request,
  }).then((response) => response.data);
}

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
 *
 * Re-exported from the shared contract so both role clients speak about the same
 * conflict; defined there, not here.
 */
