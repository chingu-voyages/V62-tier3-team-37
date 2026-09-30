import { cn } from "@/lib/utils";
import type { SignupRole } from "./SignupRoleSwitch";

type StepIndicatorProps = {
  current: number;
  total: number;
  role?: SignupRole;

  label?: string;
};

const STEP_COUNT: Record<SignupRole, number> = { HCP: 3, PATIENT: 2 };

/**
 * Compact progress marker shown above the page title on every step of the
 * signup journey.
 *
 * Presentational only — it reports the step the caller already knows about and
 * never drives navigation. The label carries the meaning for assistive tech,
 * the segment track is decorative.
 */
export function StepIndicator({ current, total, role, label }: StepIndicatorProps) {
  const stepCount = role ? STEP_COUNT[role] : total;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="type-step text-primary/80">{label ?? `Step ${current} of ${stepCount}`}</p>
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {Array.from({ length: stepCount }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional by nature.
            key={index}
            className={cn(
              "h-1 rounded-full transition-colors",
              "w-7 sm:w-9",
              index < current ? "bg-primary" : "bg-secondary/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}
