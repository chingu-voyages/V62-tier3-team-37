import {
  BadgeCheck,
  CalendarDays,
  FileText,
  type LucideIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileSectionNavProps = {
  /** Sections the profile page presents in its design. Presentational only. */
  sections: { label: string; icon: LucideIcon; active?: boolean }[];
};

export function ProfileSectionNav({ sections }: ProfileSectionNavProps) {
  return (
    <nav aria-label="Profile sections" className="min-w-0 border-b border-border">
      <ul className="-mb-px flex items-center gap-1 overflow-x-auto">
        {sections.map((section) => (
          <li key={section.label} className="shrink-0">
            <span
              aria-current={section.active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2.5 whitespace-nowrap transition-colors",
                section.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <section.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="type-label">{section.label}</span>
              {section.active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                />
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const PROFILE_SECTIONS = [
  { label: "About", icon: UserRound, active: true },
  { label: "Credentials", icon: BadgeCheck, active: false },
  { label: "Documents", icon: FileText, active: false },
  { label: "Availability", icon: CalendarDays, active: false },
  { label: "Verification", icon: ShieldCheck, active: false },
];
