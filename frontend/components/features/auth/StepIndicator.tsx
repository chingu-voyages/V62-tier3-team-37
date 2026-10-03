import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  current: number;
  /** Total steps in the journey. Supplied by the caller, never derived here. */
  total: number;
};

/**
 * Progress marker for the signup journey.
 *
 * `total` is authoritative and comes from `signupJourneySteps()`. Deriving it from
 * the role inside this component was wrong in both directions: it made the
 * stepper disagree with the flow whenever the role was not yet known (the OTP
 * screen after a refresh), and it hid the step count from the screen that actually
 * owns the journey. The step is a `progressbar` with live values plus an ordered
 * list, so a change is announced.
 */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  const safeTotal = Math.max(total, 1);
  const label = `Step ${current} of ${safeTotal}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuenow={current}
        aria-valuetext={label}
        className="type-step text-primary/80"
      >
        {label}
      </p>

      <ol className="flex items-center gap-1.5">
        {Array.from({ length: safeTotal }, (_, index) => {
          const step = index + 1;
          const complete = step < current;
          const active = step === current;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "h-1 rounded-full transition-colors",
                "w-7 sm:w-9",
                complete || active ? "bg-primary" : "bg-secondary/25",
              )}
            />
          );
        })}
      </ol>
    </div>
  );
}
