"use client";

import { Button } from "@/components/ui/button";
import { HCP_APPOINTMENT_VIEWS, type HcpAppointmentView } from "@/types/appointment";

type HcpAppointmentFilterProps = {
  value: HcpAppointmentView;
  onChange: (view: HcpAppointmentView) => void;
  /** Per-tab counts from the API, so the queue shows what is waiting. */
  counts: Record<HcpAppointmentView, number>;
};

/**
 * The clinician's workflow stages, each showing how many visits are in it.
 *
 * The count is the point of this filter. A clinician opens the page to find out
 * what needs them, and "In progress 2" answers that in a glance where a bare
 * "In progress" tab does not - it is the only stage with a blocking action, so it
 * is also the one most likely to be buried under the others.
 *
 * Built on the same fieldset + `aria-pressed` pattern as the patient's two-tab
 * filter, and takes its options from `HCP_APPOINTMENT_VIEWS` so the labels cannot
 * drift from the statuses the API is asked for.
 */
export function HcpAppointmentFilter({ value, onChange, counts }: HcpAppointmentFilterProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">Filter appointments</legend>
      <div className="flex flex-wrap gap-2">
        {HCP_APPOINTMENT_VIEWS.map((item) => {
          const selected = value === item.value;
          const count = counts[item.value] ?? 0;

          return (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              onClick={() => onChange(item.value)}
            >
              {item.label}
              <span
                className={
                  selected ? "ml-1.5 text-primary-foreground/80" : "ml-1.5 text-muted-foreground"
                }
              >
                {count}
              </span>
              <span className="sr-only">{count === 1 ? "appointment" : "appointments"}</span>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * "N appointments", announced politely.
 *
 * The stage name is not repeated in the visible text - it is already on the active
 * tab - but it is kept for screen readers so a count announced on its own still
 * says which stage it belongs to. Carries the "updating" hint while a page change
 * is in flight, so the change is announced rather than left to be noticed.
 */
export function HcpAppointmentCount({
  count,
  view,
  isUpdating = false,
}: {
  count: number;
  view: HcpAppointmentView;
  isUpdating?: boolean;
}) {
  const label = HCP_APPOINTMENT_VIEWS.find((item) => item.value === view)?.label ?? view;

  return (
    <p className="type-label font-medium text-primary" aria-live="polite">
      {count} {label.toLowerCase()} appointment{count === 1 ? "" : "s"}
      {isUpdating ? <span className="sr-only">, updating</span> : null}
    </p>
  );
}
