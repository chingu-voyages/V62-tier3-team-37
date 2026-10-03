import { cn } from "@/lib/utils";
import type { ProfileVerificationState } from "@/types/hcp-profile";
import { VERIFICATION_STATE_PRESENTATION } from "./verification-status";

type StatusBadgeProps = {
  state: ProfileVerificationState;
  className?: string;
};

/**
 * Status pill that always carries a text label, so state is never conveyed by
 * colour or icon alone.
 */
export function StatusBadge({ state, className }: StatusBadgeProps) {
  const { label, icon: Icon, className: toneClassName } = VERIFICATION_STATE_PRESENTATION[state];

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
