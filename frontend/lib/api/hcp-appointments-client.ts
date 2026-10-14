import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/appointments-contract";
import { apiRequest } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentEnvelope,
  AppointmentPageResponse,
  AppointmentStatus,
  CancelAppointmentRequest,
  HcpAppointmentView,
  RescheduleAppointmentRequest,
} from "@/types/appointment";

const APPOINTMENTS_ENDPOINT = "/api/hcp/appointments";

/** Used before the API answers, so the filter never renders `undefined` counts. */
const EMPTY_FACETS: Record<HcpAppointmentView, number> = {
  upcoming: 0,
  in_progress: 0,
  no_show: 0,
  history: 0,
};

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
  /** Per-tab counts, so the filter can show what is waiting in each group. */
  facets: Record<HcpAppointmentView, number>;
};

/**
 * One page of the clinician's own appointments, scoped to a workflow stage.
 *
 * `statuses` is sent to the API rather than filtered here on purpose. Filtering a
 * paginated page locally is what made the old screen drop rows: the server chose
 * the page, the client then threw away whatever did not match, and a page could
 * come back empty with more pages behind it. Letting the API scope means page 1 of
 * "In progress" is the first page of in-progress visits.
 *
 * Cancelled appointments are only ever returned when the caller asks for them,
 * which is what makes the "History" tab work.
 */
export function fetchHcpAppointments(
  statuses: readonly AppointmentStatus[],
  page = 1,
  perPage: number = APPOINTMENTS_PAGE_SIZE,
): Promise<HcpAppointmentsPage> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  for (const status of statuses) params.append("status[]", status);

  return apiRequest<AppointmentPageResponse>(`${APPOINTMENTS_ENDPOINT}?${params.toString()}`).then(
    (response) => ({
      appointments: response.data,
      currentPage: response.meta.current_page,
      totalPages: response.meta.last_page,
      total: response.meta.total,
      facets: EMPTY_FACETS,
      ...(response.facets as Partial<Record<HcpAppointmentView, number>>),
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
    method: "POST",
    body: request,
  }).then((response) => response.data);
}

/**
 * `POST /api/hcp/appointments/{appointment}/cancel`.
 *
 * `reason` is optional. Refused once the visit has started, which is a business rule
 * only the backend knows.
 */
export function cancelHcpAppointment(
  id: number,
  request: CancelAppointmentRequest = {},
): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/cancel`, {
    method: "POST",
    body: request,
  }).then((response) => response.data);
}

/**
 * `POST /api/hcp/appointments/{appointment}/status`.
 *
 * Attendance only: ARRIVED or NO_SHOW. Both are refused unless the visit is
 * currently BOOKED or RESCHEDULED, so a closed visit cannot be reopened.
 */
export function setHcpAttendanceStatus(
  id: number,
  status: "ARRIVED" | "NO_SHOW",
): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/status`, {
    method: "POST",
    body: { status },
  }).then((response) => response.data);
}

/**
 * `POST /api/hcp/appointments/{appointment}/summary`.
 *
 * The closing note, and what actually moves an ARRIVED visit to COMPLETED.
 * Requires the patient to have been marked as arrived first.
 */
export function summariseHcpAppointment(id: number, summary: string): Promise<Appointment> {
  return apiRequest<AppointmentEnvelope>(`${APPOINTMENTS_ENDPOINT}/${id}/summary`, {
    method: "POST",
    body: { summary },
  }).then((response) => response.data);
}

/** A result file attached to a visit, as the endpoint returns it. */
export type AppointmentResult = {
  id: number;
  title: string | null;
  original_file_name: string;
};

/**
 * `POST /api/hcp/appointments/{appointment}/results`.
 *
 * `apiRequest` is used after all: it detects a `FormData` body and leaves the
 * content type to the browser, which has to set the multipart boundary itself.
 * Sent from the action dialog rather than after the visit closes, because the
 * endpoint accepts ARRIVED as well as COMPLETED.
 */
export function uploadAppointmentResult(
  id: number,
  file: File,
  title?: string,
): Promise<AppointmentResult> {
  const body = new FormData();
  body.append("file", file);
  if (title?.trim()) body.append("title", title.trim());

  return apiRequest<{ data: AppointmentResult }>(`${APPOINTMENTS_ENDPOINT}/${id}/results`, {
    method: "POST",
    body,
  }).then((response) => response.data);
}
