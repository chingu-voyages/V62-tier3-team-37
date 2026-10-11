"use client";

import { cn } from "cn";
import { CalendarIcon, ChevronDownIcon, ClockIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The selected date, formatted the way this UI has always shown it.
 *
 * This was `date-fns`' `format(date, "MMM d, yyyy")`. `date-fns` was the only
 * thing left on the auth critical path that pulled in its token tables and
 * locale machinery for a single string, and this file was its only importer in
 * the app. `Intl` is built into the platform and produces the identical
 * "Oct 12, 2026" output. Formatter is module scope so it is built once.
 */
const SELECTED_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * The popover *contents* are a separate, on-demand chunk.
 *
 * `react-day-picker` is by far the heaviest dependency behind this control, and
 * on the auth page the date-of-birth field is just a collapsed button until
 * somebody clicks it. Loading it up front meant every visitor to `/auth` paid
 * ~70 KiB of calendar code that never rendered. `ssr: false` is safe here
 * because Radix only mounts `PopoverContent` when the popover opens, which is
 * always after hydration.
 */
const CalendarPanel = dynamic(() => import("./calendar-16-panel").then((m) => m.CalendarPanel), {
  ssr: false,
  loading: () => null,
});

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  if (Number.isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

type CalendarWithTimeRangeProps = {
  istime?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
};

const CalendarWithTimeRange = ({
  istime = true,
  value,
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  id: idProp,
}: CalendarWithTimeRangeProps) => {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [internalDate, setInternalDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12),
  );
  const date = value !== undefined || onChange ? value : internalDate;
  const setDate = (next: Date | undefined) => {
    if (onChange) onChange(next);
    else setInternalDate(next);
  };
  const [startTime, setStartTime] = useState("10:30");
  const [endTime, setEndTime] = useState("12:30");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "group/pick-date w-full  min-w-0  max-w-full justify-between text-left font-normal border-input hover:bg-accent hover:text-accent-foreground transition-all duration-200 cursor-pointer",
            !date && "text-muted-foreground",
          )}
          id={id}
          variant="outline"
          disabled={disabled}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon
              aria-hidden="true"
              className="text-muted-foreground/80 group-hover/pick-date:text-foreground shrink-0 transition-colors h-4 w-4"
            />
            {date ? (
              <span className="text-foreground font-medium text-sm">
                {SELECTED_DATE_FORMAT.format(date)}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">
                {placeholder ?? (istime ? "Pick a date and time" : "Pick a date")}
              </span>
            )}
            {istime && date && (startTime || endTime) && (
              <>
                <span className="text-muted-foreground/30 select-none">|</span>
                <div className="flex items-center gap-1.5 text-muted-foreground/90">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="text-xs font-normal">
                    {startTime ? formatTime12h(startTime) : "—"}
                    {" – "}
                    {endTime ? formatTime12h(endTime) : "—"}
                  </span>
                </div>
              </>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground/60 group-hover/pick-date:text-foreground shrink-0 transition-colors ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <CalendarPanel
          istime={istime}
          date={date}
          setDate={setDate}
          minDate={minDate}
          maxDate={maxDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarWithTimeRange;
