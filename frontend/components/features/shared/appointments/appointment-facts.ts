import { formatDateTime, formatLongDate } from "@/lib/format";
import type { Appointment, AppointmentStatus, AppointmentView } from "@/types/appointment";

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
 * Statuses a visit can still be rescheduled or cancelled from.
 *
 * Mirrors the `[BOOKED, RESCHEDULED]` guard in `AppointmentManagementService`.
 * Once attendance has been recorded the visit is locked: a patient who already
 * arrived cannot cancel, and a clinician who marked a no-show cannot reopen it.
 */
const MANAGEABLE_STATUSES: readonly AppointmentStatus[] = ["BOOKED", "RESCHEDULED"];

/**
 * How the API's status and start time combine into one label.
 *
 * The backend only closes a visit when a clinician writes a summary, so an
 * un-closed past visit reads as "Awaiting summary" rather than silently claiming
 * to be completed.
 */
export function appointmentStatusLabel(appointment: Appointment, now = new Date()): string {
  switch (appointment.status) {
    case "CANCELLED":
      return "Cancelled";
    case "COMPLETED":
      return "Completed";
    case "NO_SHOW":
      return "No show";
    case "ARRIVED":
      return "In progress";
    case "RESCHEDULED":
      return "Rescheduled";
    default:
      return isPastAppointment(appointment, now) ? "Awaiting summary" : "Upcoming";
  }
}

/** Whether the visit belongs in the "past" group. */
export function appointmentView(appointment: Appointment, now = new Date()): AppointmentView {
  return MANAGEABLE_STATUSES.includes(appointment.status) && !isPastAppointment(appointment, now)
    ? "upcoming"
    : "past";
}

/**
 * Only a booked or rescheduled, not-yet-started visit can still be changed.
 *
 * Mirrors the status guard in `AppointmentManagementService`, so the buttons are
 * hidden rather than left to fail with a validation error.
 */
export function canManageAppointment(appointment: Appointment, now = new Date()): boolean {
  return MANAGEABLE_STATUSES.includes(appointment.status) && !isPastAppointment(appointment, now);
}

/**
 * Only an *arrived* visit can be closed with a summary.
 *
 * The opposite half of `canManageAppointment`: `saveSummary` refuses anything
 * that has not been marked as arrived, so a visit in progress or already closed
 * is left alone.
 */
export function canSummariseAppointment(appointment: Appointment): boolean {
  return appointment.status === "ARRIVED";
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
