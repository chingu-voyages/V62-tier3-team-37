import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";

import { appointmentStatusLabel } from "./appointment-facts";

/** The visual states a status pill can take. */
type StatusTone = "upcoming" | "active" | "past" | "cancelled";

const TONE_CLASS: Record<StatusTone, string> = {
  upcoming: "bg-accent text-primary",
  active: "bg-secondary/10 text-secondary",
  past: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/**
 * `ARRIVED` is the only live state: the patient is at the clinic and the visit has
 * not been closed. It gets its own tone so it does not read as "upcoming", which is
 * what it would fall through to otherwise.
 */
function toneFor(appointment: Appointment): StatusTone {
  switch (appointment.status) {
    case "CANCELLED":
      return "cancelled";
    case "COMPLETED":
    case "NO_SHOW":
      return "past";
    case "ARRIVED":
      return "active";
    default:
      return "upcoming";
  }
}

/**
 * The status chip every appointment card carries.
 *
 * Separate tones for cancelled and for completed: they are both history, but one is
 * a decision and the other is a fact, and a clinician scanning the day needs to tell
 * them apart. The label is always text - state is never carried by colour alone.
 */
export function AppointmentStatusChip({
  appointment,
  now,
  className,
}: {
  appointment: Appointment;
  now?: Date;
  className?: string;
}) {
  const tone = toneFor(appointment);

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 type-helper font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {appointmentStatusLabel(appointment, now)}
    </span>
  );
}

/** The smaller "someone else is attending" marker, for both roles. */
export function BookedForSomeoneElseChip({ className }: { className?: string }) {
  return (
    <span
      className={cn("rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary", className)}
    >
      For someone else
    </span>
  );
}
