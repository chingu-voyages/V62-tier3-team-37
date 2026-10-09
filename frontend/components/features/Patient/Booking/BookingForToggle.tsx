"use client";

import { cn } from "@/lib/utils";
import { BOOKING_RECIPIENTS } from "./booking-constants";
import type { BookingFor } from "./booking-types";

type BookingForToggleProps = {
  value: BookingFor;
  onChange: (value: BookingFor) => void;
};

export function BookingForToggle({ value, onChange }: BookingForToggleProps) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
      {BOOKING_RECIPIENTS.map((option) => {
        const pressed = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            className={cn(
              "rounded-full px-2 py-2 type-helper font-medium",
              pressed ? "bg-background text-primary shadow-soft" : "text-muted-foreground",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
