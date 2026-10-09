"use client";

import { CalendarDays, type LucideIcon, Mail, UserRound } from "lucide-react";
import { formatCalendarDate } from "@/lib/format";
import { GENDER_LABELS } from "@/types/auth";

import type { BookingPatient } from "./booking-types";

/** Read-only summary of the signed-in patient's own details. */
export function PatientIdentityCard({ patient }: { patient: BookingPatient }) {
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(" ");

  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    {
      icon: CalendarDays,
      label: "Date of birth",
      value: formatCalendarDate(patient.birthDate) ?? "Not added",
    },
    {
      icon: UserRound,
      label: "Gender",
      value: patient.gender ? GENDER_LABELS[patient.gender] : "Not added",
    },
    { icon: Mail, label: "Email", value: patient.email || "Not added" },
  ];

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
    </div>
  );
}
