import { formatDateTime, formatLongDate } from "@/lib/format";
import type { Appointment, AppointmentView } from "@/types/appointment";

/**
 * What an appointment's record implies, derived once for both roles.
 *
 * These are the rules the UI has to agree with the backend about. `AppointmentManagementService`
 * decides what is still possible, and every function here exists so the buttons are
 * hidden *before* a request is refused rather than explaining a 422 afterwards.
 * Keeping them in one module is what stops the two screens from drifting apart - the
 * clinician screen learned about `complete` needing the visit to have *ended*, and
 * that rule belongs beside the others rather than inlined into a card.
 */

/** True once the visit's start time has passed. */
export function isPastAppointment(appointment: Appointment, now = new Date()): boolean {
  return new Date(appointment.scheduled_start_at).getTime() < now.getTime();
}

/** True once the visit's end time has passed. */
export function hasEndedAppointment(appointment: Appointment, now = new Date()): boolean {
  return new Date(appointment.scheduled_end_at).getTime() <= now.getTime();
}

/**
 * How the API's status and start time combine into one label.
 *
 * `CONFIRMED` alone is ambiguous: it covers both a visit next month and one that
 * already happened but has not been marked complete. The backend only moves an
 * appointment to `COMPLETED` explicitly, so the start time is what tells the two
 * apart - showing only `CONFIRMED` would tell someone with a visit from last week
 * that it is still confirmed.
 */
export function appointmentStatusLabel(appointment: Appointment, now = new Date()): string {
  if (appointment.status === "CANCELLED") return "Cancelled";
  if (appointment.status === "COMPLETED") return "Completed";
  return isPastAppointment(appointment, now) ? "Completed" : "Upcoming";
}

/** Whether the visit belongs in the "past" group. */
export function appointmentView(appointment: Appointment, now = new Date()): AppointmentView {
  return isPastAppointment(appointment, now) || appointment.status !== "CONFIRMED"
    ? "past"
    : "upcoming";
}

/**
 * Only a confirmed, not-yet-started visit can still be rescheduled or cancelled.
 *
 * Mirrors `ensureConfirmed` + `ensureNotStarted` in `AppointmentManagementService`, so
 * the buttons are hidden rather than left to fail with a validation error.
 */
export function canManageAppointment(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === "CONFIRMED" && !isPastAppointment(appointment, now);
}

/**
 * Only a confirmed visit that has *ended* can be marked complete.
 *
 * The opposite half of `canManageAppointment`: `complete` refuses anything whose
 * `scheduled_end_at` is still in the future, so a visit in progress is neither
 * cancellable nor completable - it is simply left alone.
 */
export function canCompleteAppointment(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === "CONFIRMED" && hasEndedAppointment(appointment, now);
}

/** `2026-10-11T09:00:00.000000Z` -> `11 October 2026`. */
export function appointmentDate(appointment: Appointment): string {
  return formatLongDate(appointment.scheduled_start_at) ?? "Date unavailable";
}

/**
 * `2026-10-11T09:00:00.000000Z` -> `09:00 AM`.
 *
 * `scheduled_start_at` is an instant, not a wall clock, so it is formatted through
 * `Intl` in `SLOT_TIMEZONE` - the same zone the availability endpoint used to build
 * the slot. Slicing the string instead would print UTC digits and disagree with the
 * calendar the slot was picked from.
 */
export function appointmentTime(appointment: Appointment): string {
  return formatDateTime(appointment.scheduled_start_at)?.split(", ")[1] ?? "Time unavailable";
}

/**
 * Who the visit is for, as a name.
 *
 * A SELF booking is attended by the patient themselves and an OTHER booking by the
 * named attendee, so the two branches are kept apart everywhere: showing the account
 * holder's name on a visit for someone else is actively misleading.
 *
 * The patient's own variant adds "(you)" at the call site; a clinician has no such
 * relationship to the person attending, so the raw name is all they get.
 */
export function attendeeName(appointment: Appointment): string {
  if (appointment.booking_for === "OTHER" && appointment.attendee) {
    const { first_name, last_name } = appointment.attendee;
    return `${first_name} ${last_name}`.trim();
  }
  return appointment.patient.name;
}

/** True when the attendee is someone other than the account holder. */
export function isBookedForSomeoneElse(appointment: Appointment): boolean {
  return appointment.booking_for === "OTHER";
}
