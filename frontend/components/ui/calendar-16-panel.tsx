"use client";

import { cn } from "cn";
import { ClockIcon } from "lucide-react";
import { useState } from "react";
import type { CalendarMonth } from "react-day-picker";
import { useDayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

/**
 * Contents of the date-picker popover.
 *
 * Split out of `calendar-16.tsx` and loaded on demand because it drags in
 * `react-day-picker` — by far the heaviest thing behind a control that is a
 * collapsed button until someone clicks it. The trigger stays in the parent so
 * the field itself still renders in the server HTML; only this panel is fetched
 * when the popover first opens.
 */

const PRESETS = [
  { label: "1h", value: 1 },
  { label: "2h", value: 2 },
  { label: "4h", value: 4 },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const addHoursToTime = (timeStr: string, hoursToAdd: number) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const newHour = (h + hoursToAdd) % 24;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(newHour)}:${pad(m)}`;
};

const getDurationHours = (start: string, end: string): number | null => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) return null;
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diffMin = endMin - startMin;
  if (diffMin <= 0) return null;
  return diffMin / 60;
};

function MonthCaptionWithYearInput({ calendarMonth }: { calendarMonth: CalendarMonth }) {
  const { goToMonth } = useDayPicker();
  const current = calendarMonth.date;
  const [yearText, setYearText] = useState(String(current.getFullYear()));
  const [prevYear, setPrevYear] = useState(current.getFullYear());
  if (prevYear !== current.getFullYear()) {
    setPrevYear(current.getFullYear());
    setYearText(String(current.getFullYear()));
  }

  const commitYear = () => {
    const year = Number.parseInt(yearText, 10);
    if (!Number.isNaN(year) && year >= 1000 && year <= 9999) {
      goToMonth(new Date(year, current.getMonth(), 1));
    } else {
      setYearText(String(current.getFullYear()));
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
      <div className="rounded-(--cell-radius) bg-transparent py-1 pl-1 pr-1 type-body text-foreground outline-none">
        {MONTH_NAMES[current.getMonth()]}
      </div>
      <input
        aria-label="Year"
        type="number"
        inputMode="numeric"
        min={1000}
        max={9999}
        className="w-15 z-50 rounded-(--cell-radius) border border-input bg-transparent px-2 py-1 text-center type-helper text-foreground outline-none focus-visible:border-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={yearText}
        onChange={(e) => setYearText(e.target.value)}
        onBlur={commitYear}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitYear();
          }
        }}
      />
    </div>
  );
}

export type CalendarPanelProps = {
  /** Date-only fields render no time column. */
  istime: boolean;
  date: Date | undefined;
  setDate: (next: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
};

export function CalendarPanel({
  istime,
  date,
  setDate,
  minDate,
  maxDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}: CalendarPanelProps) {
  const isInvalid = !!(startTime && endTime && startTime > endTime);
  const currentDuration = getDurationHours(startTime, endTime);
  const isAllDayActive = startTime === "09:00" && endTime === "17:00";

  return (
    <div className="flex flex-col sm:flex-row">
      {/* Left Side: Calendar */}
      <div className="p-2.5">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="p-0"
          captionLayout="label"
          components={{ MonthCaption: MonthCaptionWithYearInput }}
          startMonth={minDate ?? new Date(1900, 0)}
          endMonth={maxDate ?? new Date()}
          disabled={
            minDate && maxDate
              ? [{ before: minDate }, { after: maxDate }]
              : minDate
                ? [{ before: minDate }]
                : maxDate
                  ? [{ after: maxDate }]
                  : undefined
          }
        />
      </div>

      {istime && (
        <>
          {/* Separator for mobile */}
          <Separator orientation="horizontal" className="sm:hidden" />

          {/* Separator for desktop */}
          <Separator orientation="vertical" className="hidden sm:block" />

          {/* Right Side: Time Range & Presets */}
          <div className="flex w-full flex-col gap-4 p-4 sm:max-w-70 sm:justify-start">
            {/* Time range labels & inputs */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time Range
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Start</span>
                  <InputGroup>
                    <InputGroupInput
                      id="time-from"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="appearance-none text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                    <InputGroupAddon>
                      <ClockIcon className="text-muted-foreground/75" />
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">End</span>
                  <InputGroup className={cn(isInvalid && "border-destructive")}>
                    <InputGroupInput
                      id="time-to"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      aria-invalid={isInvalid}
                      className="appearance-none text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                    <InputGroupAddon>
                      <ClockIcon
                        className={cn("text-muted-foreground/75", isInvalid && "text-destructive")}
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                  const isActive = currentDuration === preset.value;
                  return (
                    <Button
                      key={preset.label}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 cursor-pointer text-xs font-normal transition-all w-full",
                        isActive
                          ? "shadow-sm"
                          : "hover:bg-accent hover:text-accent-foreground text-muted-foreground/80",
                      )}
                      onClick={() => {
                        setEndTime(addHoursToTime(startTime, preset.value));
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
                <Button
                  variant={isAllDayActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 cursor-pointer text-xs font-normal transition-all w-full",
                    isAllDayActive
                      ? "shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground/80",
                  )}
                  onClick={() => {
                    setStartTime("09:00");
                    setEndTime("17:00");
                  }}
                >
                  All Day
                </Button>
              </div>
            </div>

            {isInvalid && (
              <p className="animate-in fade-in text-center text-xs font-medium leading-normal text-destructive duration-200">
                End time must be after start time
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
