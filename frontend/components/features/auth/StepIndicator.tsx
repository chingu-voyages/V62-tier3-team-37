type StepIndicatorProps = {
  current: number;
  /** Total steps in the journey. Supplied by the caller, never derived here. */
  total: number;
  /** Short name of the current step, such as "Your details". */
  detail?: string;
};

/**
 * Progress marker for the signup journey.
 *
 * `total` is authoritative and comes from `signupJourneySteps()`. Deriving it from
 * the role inside this component was wrong in both directions: it made the
 * stepper disagree with the flow whenever the role was not yet known (the OTP
 * screen after a refresh), and it hid the step count from the screen that actually
 * owns the journey. The step is a `progressbar` with a live value, so a change
 * is announced.
 */
export function StepIndicator({ current, total, detail }: StepIndicatorProps) {
  const safeTotal = Math.max(total, 1);
  const label = detail
    ? `Step ${current} of ${safeTotal}: ${detail}`
    : `Step ${current} of ${safeTotal}`;

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
        {detail ? `Step ${current} of ${safeTotal}` : label}
      </p>
      {detail ? <p className="type-helper text-muted-foreground">{detail}</p> : null}

      <div
        className="h-1 w-40 overflow-hidden rounded-full bg-secondary/25 sm:w-48"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${(current / safeTotal) * 100}%` }}
        />
      </div>
    </div>
  );
}
