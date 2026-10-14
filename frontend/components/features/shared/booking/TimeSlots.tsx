"use client";

import type { FC } from "react";
import { formatClockTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HcpAvailabilitySlot } from "@/types/appointment";

type TimeSlotButtonProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

/**
 * A bare `<button>` rather than the `Button` component: these sit inside a
 * three-column grid where every cell must be the same size, and `Button` sizes to
 * its label. Kept exactly as the booking panel had it so moving it here changes
 * nothing on screen.
 */
const TimeSlotButton: FC<TimeSlotButtonProps> = ({ label, isSelected, onClick }) => {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-lg border px-2 type-label tabular-nums outline-none",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        isSelected
          ? "border-primary bg-primary font-medium text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
};

type TimeSlotsProps = {
  /** The slots the API reported as free for the selected day. */
  slots: HcpAvailabilitySlot[];
  selected: string | null;
  onSelect: (time: string) => void;
};

/**
 * The free times for the selected day, exactly as the API listed them.
 *
 * Nothing is generated here: the list is the backend's, so a slot that is already
 * booked simply is not present.
 *
 * Shared by the patient's booking panel and the clinician's reschedule dialog.
 * Both read the same availability shape, so one copy is what stops them drifting.
 *
 * The values are bare `HH:mm` wall clocks, never timestamps: the API returns a
 * calendar date and a clock time separately, and only the caller holding both can
 * turn them into an instant - via `slotToIsoTimestamp`, which knows the backend's
 * app timezone.
 */
export const TimeSlots: FC<TimeSlotsProps> = ({ slots, selected, onSelect }) => {
  // Mounts once when the first day is picked, so the enter plays then and not on every date change.
  return (
    <div className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
      <p className="type-label text-foreground">Available times</p>
      <p className="mt-1 type-helper text-muted-foreground">Each visit lasts one hour.</p>

      {/*
        A fieldset rather than `div role="group"`: these are one control group, and
        the legend is what names them. Same shape as the appointment filters in
        `PatientAppointments`.
      */}
      <fieldset className="mt-3 border-0 p-0">
        <legend className="sr-only">Available times</legend>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <TimeSlotButton
              key={slot}
              label={formatClockTime(slot)}
              isSelected={selected === slot}
              onClick={() => onSelect(slot)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
};
