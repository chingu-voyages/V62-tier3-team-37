import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

type ProfilePageHeaderProps = {
  title: string;
  description: string;
  /**
   * Where the back link goes. A profile is reached from a role's own home
   * surface, so this is the one thing that differs between them.
   */
  backHref: string;
  /** Accessible name of the back link, e.g. `Back to search`. */
  backLabel?: string;
};

/**
 * The masthead every profile screen shares: a back link, a title, and one line
 * saying what the screen is for.
 *
 * It exists as a component because the HCP and patient profiles are the same
 * page with different copy - extracting it keeps the two identical in structure
 * and leaves only the words different.
 *
 * The back link is a real `<Link>`, so it is focusable, middle-clickable and
 * prefetchable. A handler-less `<button aria-disabled>` would be focusable and
 * announced as available but would do nothing.
 */
export function ProfilePageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: ProfilePageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span className="type-label">{backLabel}</span>
        </Link>
        <h1 className="type-h1 mt-2 text-foreground">{title}</h1>
        <p className="mt-1 max-w-2xl type-body text-pretty text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

/** The two profile destinations, so a caller cannot invent a third. */
export const PROFILE_BACK_LINKS = {
  hcp: { href: ROUTES.hcpPatients, label: "Back to patients" },
  patient: { href: ROUTES.patientSearch, label: "Back to search" },
} as const;
