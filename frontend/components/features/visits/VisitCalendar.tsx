"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function VisitCalendar({
  month,
  today,
  selected,
  openDates,
  onMonth,
  onSelect,
}: {
  month: Date;
  today: Date;
  selected: string | null;
  openDates?: Set<string>;
  onMonth: (next: Date) => void;
  onSelect: (value: string) => void;
}) {
  const label = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const atCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const todayIso = toIsoDate(today);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          disabled={atCurrentMonth}
          onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="type-label text-foreground">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="type-helper text-muted-foreground">
            {day}
          </span>
        ))}
        {monthCells(month).map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const value = toIsoDate(date);
          const available = openDates ? openDates.has(value) : isBookable(date, today);
          const isSelected = selected === value;
          const isToday = value === todayIso;
          return (
            <button
              key={value}
              type="button"
              disabled={!available}
              aria-pressed={isSelected}
              aria-label={formatLongDate(value)}
              className={cn(
                "mx-auto flex size-10 items-center justify-center rounded-full type-helper",
                isSelected && "bg-primary text-primary-foreground",
                available && !isSelected && "bg-accent text-primary hover:bg-secondary/20",
                isToday && available && !isSelected && "ring-2 ring-primary/25",
                !available && "text-muted-foreground/40",
              )}
              onClick={() => onSelect(value)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthCells(month: Date): Array<number | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  return cells;
}

function isBookable(date: Date, today: Date): boolean {
  if (startOfDay(date) < today) return false;
  const weekday = date.getDay();
  return weekday >= 2 && weekday <= 6;
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
