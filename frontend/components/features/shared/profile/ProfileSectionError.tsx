import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileSectionErrorProps = {
  message: string;
  retryLabel?: string;
  onRetry: () => void;
  className?: string;
};

/**
 * Error presentation for a single profile section. Keeps the failure contained so
 * sibling sections stay visible, and never surfaces the raw error.
 *
 * Server Component — it only becomes interactive through the `onRetry` prop, so the
 * owning `error.tsx` supplies the client directive and this file stays reusable
 * from anywhere.
 */
export function ProfileSectionError({
  message,
  retryLabel = "Retry",
  onRetry,
  className,
}: ProfileSectionErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <p className="type-body text-foreground">{message}</p>
      </div>

      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

/**
 * Per-section failure copy for both profile surfaces.
 *
 * The ten `error.tsx` files across the HCP and patient routes were identical
 * apart from one message string, so the wording lived in ten places and could
 * drift. Copy changes now touch one map - and a slot name that is not in it is a
 * type error, not a silently blank section.
 *
 * `overview` is shared: both roles' identity panel fails the same way.
 */
export const PROFILE_SECTION_ERROR_MESSAGES = {
  overview: "We couldn't load your profile information.",

  // HCP sections.
  verification: "We couldn't load your verification status.",
  professional: "We couldn't load your professional details.",
  details: "We couldn't load your professional preferences.",
  availability: "We couldn't load your availability.",

  // Patient sections.
  health: "We couldn't load your health profile.",
  allergies: "We couldn't load your allergies.",
} as const satisfies Record<string, string>;

export type ProfileSectionErrorMessages = typeof PROFILE_SECTION_ERROR_MESSAGES;
