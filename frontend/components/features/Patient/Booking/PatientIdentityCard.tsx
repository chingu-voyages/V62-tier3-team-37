"use client";

import { CalendarDays, type LucideIcon, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { formatCalendarDate } from "@/lib/format";
import { GENDER_LABELS } from "@/types/auth";

import type { BookingPatient } from "./booking-types";

/**
 * Read-only summary of the signed-in patient's own details.
 *
 * Read-only is not a limitation, it is what the API supports: for a visit booked
 * "Myself" the backend takes the patient from the session and ignores any attendee
 * payload, and `PATCH /patient/profile` has no `birth_date` or `gender` rule - so an
 * editable copy of these fields could only ever fail validation. The row that is
 * missing links to the one screen where the patient can complete it.
 */
export function PatientIdentityCard({ patient }: { patient: BookingPatient }) {
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(" ");

  const rows: { icon: LucideIcon; label: string; value: string; isMissing: boolean }[] = [
    {
      icon: CalendarDays,
      label: "Date of birth",
      value: formatCalendarDate(patient.birthDate) ?? "Not added",
      isMissing: !patient.birthDate,
    },
    {
      icon: UserRound,
      label: "Gender",
      value: patient.gender ? GENDER_LABELS[patient.gender] : "Not added",
      isMissing: !patient.gender,
    },
    {
      icon: Mail,
      label: "Email",
      value: patient.email || "Not added",
      isMissing: !patient.email,
    },
  ];

  const hasMissingRow = rows.some((row) => row.isMissing);

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-accent">
      <p className="px-3 pt-3 type-helper font-medium text-primary">From your account</p>
      <p className="px-3 pb-2 type-h4 text-foreground">{name || "Your profile"}</p>

      <ul className="bg-background/70">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center gap-3 border-t border-secondary/15 px-3 py-2.5"
          >
            <row.icon className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="type-helper text-muted-foreground">{row.label}</span>
            <span className="ml-auto min-w-0 truncate text-right type-helper font-medium text-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      {hasMissingRow ? (
        // One link for the whole card rather than one per row: the gaps are all fixed
        // in the same place, so three identical affordances would be noise.
        <p className="border-t border-secondary/15 bg-background/70 px-3 py-2.5">
          <Link
            href={ROUTES.patientProfile}
            className="type-helper font-medium text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Complete your profile
          </Link>
          <span className="ml-1.5 type-helper text-muted-foreground">
            so clinicians know who you are.
          </span>
        </p>
      ) : null}
    </div>
  );
}
