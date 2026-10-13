"use client";

import { Check } from "lucide-react";
import { formatLongDate } from "@/lib/format";
import type { HCP } from "@/types/hcp-directory";

export type BookingSummary = {
  date: string;
  timeLabel: string;
  location: string;
  /** Whose visit this is, already resolved to a display name. */
  forName: string;
  notes: string;
};

type BookingConfirmationProps = {
  doctor: HCP;
  summary: BookingSummary;
};

/** Post-submit state: what was booked, where, and for whom. */
export function BookingConfirmation({ doctor, summary }: BookingConfirmationProps) {
  const rows = [
    { label: "Clinician", value: doctor.fullName },
    { label: "When", value: `${formatLongDate(summary.date)} · ${summary.timeLabel}` },
    { label: "Length", value: "1 hour" },
    { label: "Where", value: summary.location || "Clinic" },
    { label: "For", value: summary.forName },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center px-2 pt-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <Check className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-4 type-h3 text-foreground">You&rsquo;re booked</p>
        <p className="mt-1 max-w-xs type-body text-muted-foreground">
          {doctor.specialties[0] ?? "This visit"} with {doctor.fullName} is on your account.
        </p>
      </div>

      <dl className="overflow-hidden rounded-2xl bg-background shadow-card ring-1 ring-border/70">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-border/70 px-4 py-3 last:border-b-0"
          >
            <dt className="type-helper text-muted-foreground">{row.label}</dt>
            <dd className="text-right type-helper font-medium text-foreground">{row.value}</dd>
          </div>
        ))}

        {summary.notes ? (
          <div className="border-t border-border/70 px-4 py-3">
            <dt className="type-helper text-muted-foreground">Notes</dt>
            <dd className="mt-1 type-body text-foreground">{summary.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
