"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BOOKING_WEEKDAYS,
  isSameMonth,
  monthCellKeys,
  monthCells,
  shiftMonth,
  toIsoDate,
} from "@/lib/booking/schedule";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HcpAvailabilitySlot } from "@/types/appointment";

type MonthCalendarProps = {
  month: Date;
  today: Date;
  selected: string | null;
  /**
   * Slots per date, as the availability endpoint reported them.
   *
   * A day is bookable when it has at least one slot. Until availability loads the
   * map is empty and no day is selectable, rather than the calendar guessing from a
   * weekly rule the backend does not share.
   */
  availability: Map<string, HcpAvailabilitySlot[]>;
  /** Availability for the visible month is still loading. */
  isLoading?: boolean;
  onMonthChange: (month: Date) => void;
  onSelect: (isoDate: string) => void;
};

/** Single-month grid. Only days with free slots are clickable; the rest stay inert. */
export function MonthCalendar({
  month,
  today,
  selected,
  availability,
  isLoading = false,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const todayIso = toIsoDate(today);
  const cells = monthCells(month);
  const cellKeys = monthCellKeys(month);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          disabled={isSameMonth(month, today)}
          onClick={() => onMonthChange(shiftMonth(month, -1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="type-label text-foreground">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {BOOKING_WEEKDAYS.map((weekday) => (
          <span key={weekday} className="type-helper text-muted-foreground">
            {weekday}
          </span>
        ))}

        {cells.map((day, index) =>
          day === null ? (
            <span key={cellKeys[index]} />
          ) : (
            <CalendarDay
              key={`${month.getFullYear()}-${month.getMonth()}-${day}`}
              day={day}
              month={month}
              todayIso={todayIso}
              selected={selected}
              slots={availability.get(
                toIsoDate(new Date(month.getFullYear(), month.getMonth(), day)),
              )}
              isLoading={isLoading}
              onSelect={onSelect}
            />
          ),
        )}
      </div>
    </div>
  );
}

function CalendarDay({
  day,
  month,
  todayIso,
  selected,
  slots,
  isLoading,
  onSelect,
}: {
  day: number;
  month: Date;
  todayIso: string;
  selected: string | null;
  slots: HcpAvailabilitySlot[] | undefined;
  isLoading: boolean;
  onSelect: (isoDate: string) => void;
}) {
  const isoDate = toIsoDate(new Date(month.getFullYear(), month.getMonth(), day));

  // A day is bookable only if the API said there is something to book, and it is
  // not in the past.
  const hasSlots = Boolean(slots && slots.length > 0);
  const isPast = isoDate < todayIso;
  const bookable = !isPast && hasSlots && !isLoading;
  const isSelected = selected === isoDate;

  return (
    <button
      type="button"
      disabled={!bookable}
      aria-pressed={isSelected}
      aria-label={`${formatLongDate(isoDate)}${
        hasSlots ? `, ${slots?.length} times available` : ", fully booked"
      }`}
      className={cn(
        "mx-auto flex size-10 items-center justify-center rounded-full type-helper",
        isSelected && "bg-primary text-primary-foreground",
        bookable && !isSelected && "bg-accent text-primary hover:bg-secondary/20",
        !isSelected && isoDate === todayIso && bookable && "ring-2 ring-primary/25",
        !bookable && !isSelected && "text-muted-foreground/40",
      )}
      onClick={() => onSelect(isoDate)}
    >
      {day}
    </button>
  );
}
