import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * How a stored allergy severity reads on screen.
 *
 * `UpdatePatientProfileRequest` validates severity as free text and nothing more,
 * so a stored value outside this table has to survive a round trip untouched.
 * Anything unrecognised renders as its own text in a neutral pill rather than
 * being rewritten to a value the patient never typed.
 */

type SeverityPresentation = {
  label: string;
  icon: LucideIcon;
  className: string;
};

const SEVERITY_BY_KEYWORD: { match: string; presentation: SeverityPresentation }[] = [
  { match: "mild", presentation: { label: "Mild", icon: CircleCheck, className: "text-primary" } },
  {
    match: "moderate",
    presentation: { label: "Moderate", icon: Info, className: "text-amber-600" },
  },
  {
    match: "severe",
    presentation: { label: "Severe", icon: CircleAlert, className: "text-destructive" },
  },
];

const UNRECOGNISED: SeverityPresentation = {
  label: "",
  icon: Info,
  className: "text-muted-foreground",
};

function severityPresentation(severity: string): SeverityPresentation {
  const normalised = severity.trim().toLowerCase();

  const known = SEVERITY_BY_KEYWORD.find((entry) => normalised.includes(entry.match));
  return known ? known.presentation : { ...UNRECOGNISED, label: severity.trim() };
}

/**
 * Severity as a pill. Always carries its text, so severity is never conveyed by
 * colour or icon alone.
 */
export function AllergySeverityBadge({
  severity,
  className,
}: {
  severity: string | undefined;
  className?: string;
}) {
  if (!severity) return null;

  const { label, icon: Icon, className: toneClassName } = severityPresentation(severity);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/25 bg-current/10 px-2 py-1 type-helper font-medium",
        toneClassName,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
