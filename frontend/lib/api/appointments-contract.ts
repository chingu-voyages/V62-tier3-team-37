import { ApiError } from "@/lib/api/response";

/**
 * The parts of the appointments wire contract both roles share.
 *
 * `GET /patient/appointments` and `GET /hcp/appointments` are answered by the *same*
 * `AppointmentResource`, so the record shape, the paging default and the meaning of a
 * 409 are identical for both sides. What differs is only the path each role writes to,
 * which is why each role still has its own client - but none of the vocabulary
 * below has to be written twice.
 */

/**
 * Rows per request.
 *
 * Fifteen is the backend's own `paginate()` default, so leaving it unset would give
 * the same page anyway - it is passed explicitly so the client and the controller
 * cannot drift apart unnoticed.
 */
export const APPOINTMENTS_PAGE_SIZE = 15;

/**
 * HTTP 409 - the slot was taken between reading availability and submitting.
 *
 * Worth naming because the recovery differs from every other failure: the form
 * values are fine, the *slot* is gone, so the caller refreshes availability rather
 * than re-showing a validation error. Both `reschedule` endpoints raise it.
 */
export const SLOT_CONFLICT_STATUS = 409;

export function isSlotConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === SLOT_CONFLICT_STATUS;
}

/**
 * HTTP 403 from the `hcp.verified` middleware.
 *
 * The HCP appointments routes sit behind that gate, so an unverified clinician gets
 * a 403 rather than an empty list. It is a state to explain, not a failure to retry.
 */
export function isForbidden(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}
