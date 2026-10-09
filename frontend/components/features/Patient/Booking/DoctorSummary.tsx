"use client";

import { Banknote, Clock3, type LucideIcon, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { HCP } from "@/types/hcp-directory";

type DoctorSummaryProps = {
  doctor: HCP;
  location: string;
};

export function DoctorSummary({ doctor, location }: DoctorSummaryProps) {
  return (
    <article className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70">
      <div className="flex items-center gap-3">
        <Avatar className="size-14 shrink-0">
          {/* Only rendered when there is a photo: an empty `src` would fail to load
              and fall back to the initials anyway, hiding the difference between
              "no photo" and "broken photo URL". */}
          {doctor.avatar ? <AvatarImage src={doctor.avatar} alt="" /> : null}
          <AvatarFallback className="bg-accent font-heading text-lg text-primary">
            {doctorInitials(doctor.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate type-h3 text-foreground">{doctor.fullName}</p>
          <p className="type-helper text-muted-foreground">{doctor.specialties[0]}</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {location ? <MetaChip icon={MapPin} label={location} /> : null}
        {doctor.waitingTime ? <MetaChip icon={Clock3} label={doctor.waitingTime} /> : null}
        {doctor.fees !== undefined ? (
          <MetaChip
            icon={Banknote}
            label={`${doctor.fees} ${doctor.currency ?? ""}`.trim()}
            tone="accent"
          />
        ) : null}
      </ul>
    </article>
  );
}

function MetaChip({
  icon: Icon,
  label,
  tone = "muted",
}: {
  icon: LucideIcon;
  label: string;
  tone?: "muted" | "accent";
}) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-helper",
        tone === "accent" ? "bg-accent text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </li>
  );
}

export function doctorInitials(fullName: string): string {
  return fullName
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
