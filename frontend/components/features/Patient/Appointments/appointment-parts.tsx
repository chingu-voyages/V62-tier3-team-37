import { CalendarClock, CalendarPlus, Clock, Stethoscope, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton, skeletonKeys } from "@/components/ui/skeleton";
import { formatDateTime, formatLongDate } from "@/lib/format";
import type { Appointment, AppointmentView } from "@/types/appointment";

type AppointmentListSkeletonProps = {
  /** How many placeholder rows to draw. Defaults to a short page. */
  count?: number;
};

/**
 * Placeholder rows while `GET /patient/appointments` is in flight.
 *
 * Mirrors `AppointmentCard` - name, status chip, meta row, actions - so the list
 * does not jump when the real rows land. This is the *pending* state only;
 * `AppointmentsErrorState` covers a request that failed and
 * `AppointmentsEmptyState` a request that legitimately returned nothing.
 */
export function AppointmentListSkeleton({ count = 4 }: AppointmentListSkeletonProps) {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-3">
      {skeletonKeys(count).map((key) => (
        <li
          key={key}
          className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-32" />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}

type AppointmentsErrorStateProps = {
  /** The backend's message, or a network/offline fallback. */
  message: string;
  onRetry: () => void;
  /** Set while a retry is already in flight, so the button can disable itself. */
  isRetrying?: boolean;
};

/**
 * The request failed.
 *
 * Distinct from the empty state on purpose: an empty list is a normal answer and
 * needs no alarm, whereas a failure means the patient's real appointments are still
 * out there and something has to be retried. The message comes from the API so a
 * 401 or a 409 is described in the words the backend chose.
 *
 * `role="alert"` so a screen reader announces the failure without hunting for it.
 */
export function AppointmentsErrorState({
  message,
  onRetry,
  isRetrying = false,
}: AppointmentsErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-14 text-center"
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      </div>

      <h2 className="type-h2 text-foreground">We couldn&apos;t load your appointments</h2>

      <p className="mt-2 max-w-md type-body text-muted-foreground">{message}</p>

      <Button variant="secondary" className="mt-6" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}

type AppointmentsEmptyStateProps = {
  view: AppointmentView;
  /** Send the patient to the directory to make their first booking. */
  onBrowseDoctors: () => void;
};

/**
 * A resolved but empty list.
 *
 * "Nothing here" is a success state, so it is styled as an invitation rather than as
 * a fault - and it names the action that fills the list.
 */
export function AppointmentsEmptyState({ view, onBrowseDoctors }: AppointmentsEmptyStateProps) {
  const isUpcoming = view === "upcoming";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-accent/40 px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent">
        {isUpcoming ? (
          <CalendarPlus className="size-8 text-primary/60" aria-hidden="true" />
        ) : (
          <Clock className="size-8 text-primary/60" aria-hidden="true" />
        )}
      </div>

      <h2 className="type-h2 text-foreground">
        {isUpcoming ? "No upcoming appointments" : "No past appointments"}
      </h2>

      <p className="mt-2 max-w-md type-body text-muted-foreground">
        {isUpcoming
          ? "Book a visit with a healthcare professional and it will appear here with the date, time, and clinician."
          : "Once a visit has taken place it moves here, so you have the full history in one place."}
      </p>

      {isUpcoming && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onBrowseDoctors}>
          <Stethoscope className="mr-1.5 size-3.5" aria-hidden="true" />
          Find a doctor
        </Button>
      )}
    </div>
  );
}

type AppointmentCardProps = {
  appointment: Appointment;
  onView: () => void;
  onReschedule: () => void;
  onCancel: () => void;
};

/**
 * How the API's status and start time combine into one label.
 *
 * `CONFIRMED` alone is ambiguous: it covers both a visit next month and one that
 * already happened but has not been marked complete. The backend only moves an
 * appointment to `COMPLETED` explicitly, so the start time is what tells the two
 * apart - showing only `CONFIRMED` would tell a patient with a visit from last week
 * that it is still confirmed.
 */
export function appointmentStatusLabel(appointment: Appointment): string {
  if (appointment.status === "CANCELLED") return "Cancelled";
  if (appointment.status === "COMPLETED") return "Completed";
  return isPastAppointment(appointment) ? "Completed" : "Upcoming";
}

/** True once the visit's start time has passed. */
export function isPastAppointment(appointment: Appointment, now = new Date()): boolean {
  return new Date(appointment.scheduled_start_at).getTime() < now.getTime();
}

/** Whether the visit belongs in the "past" group. */
export function appointmentView(appointment: Appointment, now = new Date()): AppointmentView {
  return isPastAppointment(appointment, now) || appointment.status !== "CONFIRMED"
    ? "past"
    : "upcoming";
}

/**
 * Only a confirmed, not-yet-started visit can still be changed.
 *
 * Mirrors the backend's own guard in `AppointmentManagementService`: cancelling or
 * rescheduling after the start is refused there, so the buttons are hidden rather
 * than left to fail with a validation error.
 */
export function canManageAppointment(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === "CONFIRMED" && !isPastAppointment(appointment, now);
}

/** `2026-10-11T09:00:00.000000Z` -> `11 October 2026`. */
export function appointmentDate(appointment: Appointment): string {
  return formatLongDate(appointment.scheduled_start_at) ?? "Date unavailable";
}

/**
 * `2026-10-11T09:00:00.000000Z` -> `09:00`.
 *
 * `scheduled_start_at` is an instant, not a wall clock, so it is formatted through
 * `Intl` in `SLOT_TIMEZONE` - the same zone the availability endpoint used to build
 * the slot. Slicing the string instead would print UTC digits and disagree with the
 * calendar the patient picked from.
 */
export function appointmentTime(appointment: Appointment): string {
  return formatDateTime(appointment.scheduled_start_at)?.split(", ")[1] ?? "Time unavailable";
}

export function AppointmentCard({
  appointment,
  onView,
  onReschedule,
  onCancel,
}: AppointmentCardProps) {
  const status = appointmentStatusLabel(appointment);
  const manageable = canManageAppointment(appointment);

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="type-h3 text-foreground">{appointment.hcp.name}</h2>
          <span
            className={
              status === "Upcoming"
                ? "rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary"
                : "rounded-full bg-muted px-2.5 py-0.5 type-helper text-muted-foreground"
            }
          >
            {status}
          </span>
          {appointment.booking_for === "OTHER" && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary">
              For someone else
            </span>
          )}
        </div>

        {appointment.hcp.specialty && (
          <p className="mt-1 type-body text-muted-foreground">{appointment.hcp.specialty}</p>
        )}

        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-label text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {appointmentDate(appointment)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {appointmentTime(appointment)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onView}>
          View
        </Button>
        {manageable && (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={onReschedule}>
              Postpone
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
