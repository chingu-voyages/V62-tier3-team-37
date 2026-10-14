import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/appointment";
import { AppointmentStatusChip } from "./AppointmentStatusChip";
import {
  appointmentDate,
  appointmentTime,
  canManageAppointment,
  canSummariseAppointment,
} from "./appointment-facts";

type AppointmentCardProps = {
  appointment: Appointment;
  /**
   * The subject of the visit.
   *
   * The clinician for a patient, the person attending for a clinician. Kept as a prop
   * because the layout is identical and only the label changes - the alternative was
   * two card components that had to be edited in step.
   */
  title: string;
  subtitle?: string;
  /** Chips beside the status, e.g. "For someone else". */
  badges?: ReactNode;
  /** Role-specific facts - a specialty for a patient, the attendee's details for a clinician. */
  children?: ReactNode;
  onView: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  /**
   * Opens the unified update dialog. When given it replaces the per-outcome buttons
   * above, because a clinician picks the outcome inside the dialog rather than
   * being offered five buttons and having to know which one they want.
   */
  onAction?: () => void;
};

/**
 * One appointment as a row: who it is with, when, and what can still be done to it.
 *
 * The chrome and the button rules are shared; the subject and the extra facts are
 * the caller's. Which buttons appear is decided here from the record rather than by
 * the caller, because both roles are bound by the same backend state machine - a
 * second copy of that rule in each screen is how one of them ends up offering an
 * action the API will refuse.
 */
export function AppointmentCard({
  appointment,
  title,
  subtitle,
  badges,
  children,
  onView,
  onReschedule,
  onCancel,
  onAction,
}: AppointmentCardProps) {
  const manageable = canManageAppointment(appointment);
  // Anything the API will still accept: reschedule/cancel/attendance need a
  // BOOKED or RESCHEDULED visit, closing needs an ARRIVED one.
  const actionable = manageable || canSummariseAppointment(appointment);

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="type-h3 text-foreground">{title}</h2>
          <AppointmentStatusChip appointment={appointment} />
          {badges}
        </div>

        {subtitle ? <p className="mt-1 type-body text-muted-foreground">{subtitle}</p> : null}

        {children ? <div className="mt-3">{children}</div> : null}

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 type-label text-muted-foreground">
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

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onView}>
          View
        </Button>

        {/* The clinician's single entry point. Every change the API accepts is
            chosen inside the dialog, so the card carries one button instead of
            one per outcome - and the set of legal changes changes with the
            status, which a static row of buttons cannot express. */}
        {onAction && actionable ? (
          <Button type="button" size="sm" variant="secondary" onClick={onAction}>
            <CheckCircle2 className="mr-1.5 size-3.5" aria-hidden="true" />
            Update visit
          </Button>
        ) : null}

        {/* The per-outcome buttons are the fallback for a caller that has not moved
            to the unified dialog - the patient's screen still uses these. */}
        {!onAction && manageable ? (
          <>
            {onReschedule ? (
              <Button type="button" size="sm" variant="secondary" onClick={onReschedule}>
                Postpone
              </Button>
            ) : null}
            {onCancel ? (
              <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}
