import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/appointments-contract";
import { apiRequest } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentEnvelope,
  AppointmentPageResponse,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

const APPOINTMENTS_ENDPOINT = "/api/hcp/appointments";

/**
 * One page of the clinician's own appointments.
 *
 * Scoped server-side to the signed-in provider: the controller reads
 * `$request->user()->hcpAppointments()`, so a clinician can never see another
 * clinician's list by changing the request.
 *
 * The record is the same `AppointmentResource` the patient endpoint returns, so the
 * page can share its card, its paging and its query keys with the patient screen.
 * What the resource adds for this side is `attendee` - the person who will actually
 * attend, which for a SELF booking is the patient themself.
 *
 * Every route here sits behind the `hcp.verified` middleware, so an unverified
 * account receives a 403 rather than a list. `isForbidden` turns that into a state
 * to explain instead of an error to retry.
 */
export type HcpAppointmentsPage = {
  appointments: Appointment[];
  currentPage: number;
  totalPages: number;
  total: number;
};

export function fetchHcpAppointments(
  page = 1,
  perPage: number = APPOINTMENTS_PAGE_SIZE,
): Promise<HcpAppointmentsPage> {
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
 * `GET /api/hcp/appointments/{appointment}`.
 *
 * Used for the detail dialog rather than the row already in the cache: the list is a
 * paginated projection and may not hold the appointment being opened, and the
 * controller re-reads it with the clinician's ownership constraint applied.
 *
 * A 404 here means "not yours, or gone". Both are the same to the caller, so the
 * error is surfaced rather than retried.
 */
export function fetchHcpAppointment(id: number): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}`).then(
    (response) => response.data,
  );
}

/**
 * `PATCH /api/hcp/appointments/{appointment}/reschedule`.
 *
 * The new start must carry an explicit offset or `Z`, and the slot has to be one of
 * the clinician's own free slots that does not collide with the patient's other
 * visits - the backend answers 409 when it is not. The returned appointment, not the
 * requested one, is the result.
 */
export function rescheduleHcpAppointment(
  id: number,
  request: RescheduleAppointmentRequest,
): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/reschedule`, {
    method: "PATCH",
    body: request,
  }).then((response) => response.data);
}

/**
 * `PATCH /api/hcp/appointments/{appointment}/cancel`.
 *
 * `reason` is optional. Refused once the visit has started, which is a business rule
 * only the backend knows.
 */
export function cancelHcpAppointment(
  id: number,
  request: CancelAppointmentRequest = {},
): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/cancel`, {
    method: "PATCH",
    body: request,
  }).then((response) => response.data);
}

/**
 * `PATCH /api/hcp/appointments/{appointment}/complete`.
 *
 * Clinician-only, and only once the visit has *ended*: `complete` refuses a
 * confirmed appointment whose `scheduled_end_at` is still in the future. Takes no
 * body, so it is sent without one.
 */
export function completeHcpAppointment(id: number): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/complete`, {
    method: "PATCH",
  }).then((response) => response.data);
}
