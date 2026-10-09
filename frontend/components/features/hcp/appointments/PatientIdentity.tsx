"use client";

import { Mail, UserRound } from "lucide-react";
import { calculateAge, formatEnumLabel } from "@/lib/format";
import type { Appointment } from "@/types/appointment";

/**
 * Who is coming, in the terms a clinician needs before the visit.
 *
 * The record carries the account holder (`patient.name`) and the attendee
 * (`attendee` - first name, last name, email, date of birth, gender). For a SELF
 * booking those are the same person; for an OTHER booking the account holder booked
 * it and somebody else attends. The card is titled with the *attendee* either way,
 * because that is who walks in, and it says who did the booking when the two differ.
 *
 * Age is derived here rather than read from the API: `AppointmentResource` has no age
 * field, and computing it from the birth date every render keeps it from being
 * stored once and going stale.
 */
export function PatientIdentity({ appointment }: { appointment: Appointment }) {
  const { attendee } = appointment;
  if (!attendee) return null;

  const name = `${attendee.first_name} ${attendee.last_name}`.trim();
  const age = calculateAge(attendee.birth_date);

  // A null attendee is not expected - the resource always projects one - but the
  // branch keeps a malformed record from rendering an empty identity block.
  const facts = [
    name ? { key: "name", icon: UserRound, text: name } : null,
    age === undefined ? null : { key: "age", icon: null, text: `${age} years` },
    attendee.gender ? { key: "gender", icon: null, text: formatEnumLabel(attendee.gender) } : null,
    attendee.email ? { key: "email", icon: Mail, text: attendee.email } : null,
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);

  return (
    <div className="flex flex-col gap-2.5">
      {appointment.booking_for === "OTHER" ? (
        // Stated rather than implied: a clinician who reads one name on the card and
        // another in the account needs to know which of them to expect.
        <p className="type-helper text-muted-foreground">
          Booked by <span className="font-medium text-foreground">{appointment.patient.name}</span>
        </p>
      ) : null}

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {facts.map((fact) => (
          <li
            key={fact.key}
            className="inline-flex items-center gap-1.5 type-label text-foreground"
          >
            {fact.icon ? (
              <fact.icon className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
            ) : null}
            {fact.text}
          </li>
        ))}
      </ul>

      {appointment.notes ? (
        // The patient wrote these for the clinician, so they sit on the card rather
        // than behind "View" - a reason for the visit should not need a click.
        <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 type-helper text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> {appointment.notes}
        </p>
      ) : null}
    </div>
  );
}
