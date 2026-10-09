"use client";

import { Button } from "@/components/ui/button";
import { APPOINTMENT_VIEWS, type AppointmentView } from "@/types/appointment";

type AppointmentViewFilterProps = {
  value: AppointmentView;
  /**
   * Fired with the new view. Changing view also resets the page, so the callback
   * receives both - page 4 of "upcoming" means nothing against "past".
   */
  onChange: (view: AppointmentView) => void;
};

/**
 * Upcoming / Past, as a real fieldset of toggle buttons.
 *
 * A `fieldset` with an `aria-pressed` button per option rather than a `<select>`:
 * two mutually exclusive states, both worth naming on screen at once. Switching
 * resets to page 1, because a page number only means something within a view.
 */
export function AppointmentViewFilter({ value, onChange }: AppointmentViewFilterProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">Filter appointments</legend>
      <div className="flex flex-wrap gap-2">
        {APPOINTMENT_VIEWS.map((item) => {
          const selected = value === item.value;

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
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * "N upcoming appointments", announced politely.
 *
 * Also carries the "updating" hint while a page change is in flight, so a screen
 * reader is told the count is about to change rather than being left to notice.
 */
export function AppointmentCount({
  count,
  view,
  isUpdating = false,
}: {
  count: number;
  view: AppointmentView;
  isUpdating?: boolean;
}) {
  return (
    <p className="type-label font-medium text-primary" aria-live="polite">
      {count} {view === "upcoming" ? "upcoming" : "past"} appointment{count === 1 ? "" : "s"}
      {isUpdating ? <span className="sr-only">, updating</span> : null}
    </p>
  );
}
