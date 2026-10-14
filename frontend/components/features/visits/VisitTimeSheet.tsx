"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { startOfDay, VisitCalendar } from "@/components/features/visits/VisitCalendar";
import { formatClockTime, formatLongDate } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/visit-client";
import { cn } from "@/lib/utils";

export function VisitTimeSheet({
  open,
  title,
  subtitle,
  description,
  confirmLabel,
  loadSlots,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  description: string;
  confirmLabel: string;
  loadSlots: () => Promise<{ data: Record<string, string[]> }>;
  onClose: () => void;
  onConfirm: (date: string, time: string) => Promise<void>;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="top-0 right-0 bottom-0 left-auto flex h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l border-border bg-muted p-0 ring-0 sm:max-w-lg sm:rounded-l-3xl sm:p-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
        {open ? (
          <TimeForm
            key={subtitle}
            variant="sheet"
            title={title}
            subtitle={subtitle}
            description={description}
            confirmLabel={confirmLabel}
            loadSlots={loadSlots}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        ) : (
          <DialogTitle className="sr-only">{title}</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function VisitTimePicker({
  confirmLabel,
  loadSlots,
  onClose,
  onConfirm,
}: {
  confirmLabel: string;
  loadSlots: () => Promise<{ data: Record<string, string[]> }>;
  onClose: () => void;
  onConfirm: (date: string, time: string) => Promise<void>;
}) {
  return (
    <TimeForm
      variant="inline"
      title=""
      subtitle=""
      description=""
      confirmLabel={confirmLabel}
      loadSlots={loadSlots}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function TimeForm({
  variant,
  title,
  subtitle,
  description,
  confirmLabel,
  loadSlots,
  onClose,
  onConfirm,
}: {
  variant: "sheet" | "inline";
  title: string;
  subtitle: string;
  description: string;
  confirmLabel: string;
  loadSlots: () => Promise<{ data: Record<string, string[]> }>;
  onClose: () => void;
  onConfirm: (date: string, time: string) => Promise<void>;
}) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSlotsRef = useRef(loadSlots);
  loadSlotsRef.current = loadSlots;

  useEffect(() => {
    let cancelled = false;
    loadSlotsRef.current()
      .then((response) => {
        if (!cancelled) setSlots(response.data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const times = (selectedDate ? (slots?.[selectedDate] ?? []) : []).map((value) => ({
    value,
    label: formatClockTime(value),
  }));
  const timeLabel = times.find((slot) => slot.value === selectedTime)?.label;

  async function confirm() {
    if (!selectedDate || !selectedTime) {
      setError("Choose a date and a time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selectedDate, selectedTime);
      onClose();
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const schedule = (
        <section className={variant === "inline" ? "" : "rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70"}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="type-label text-foreground">When</h3>
            <p className="type-helper text-muted-foreground">
              {selectedDate ? formatLongDate(selectedDate) : "Open days are highlighted"}
            </p>
          </div>
          <VisitCalendar
            month={month}
            today={today}
            selected={selectedDate}
            openDates={new Set(Object.keys(slots ?? {}))}
            onMonth={setMonth}
            onSelect={(value) => {
              setSelectedDate(value);
              setSelectedTime(null);
              setError(null);
            }}
          />
          <div className="mt-4 border-t border-border/70 pt-4">
            {slots === null && !error ? (
              <p className="type-helper text-muted-foreground">Loading open times…</p>
            ) : selectedDate ? (
              <>
                <p className="type-label text-foreground">Available times</p>
                <p className="mt-1 type-helper text-muted-foreground">
                  Each visit is 30 minutes, inside the clinic hours.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {times.length === 0 ? (
                    <p className="col-span-3 type-helper text-muted-foreground">No open times on this day.</p>
                  ) : null}
                  {times.map((slot) => {
                    const chosen = selectedTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        aria-pressed={chosen}
                        className={cn(
                          "rounded-full border px-2 py-2 type-helper",
                          chosen
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-accent",
                        )}
                        onClick={() => {
                          setSelectedTime(slot.value);
                          setError(null);
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-muted px-3 py-3 type-helper text-muted-foreground">
                Choose an open day. Times for that day appear here.
              </p>
            )}
          </div>
        </section>
  );

  const actions = (
      <div className={variant === "inline" ? "mt-4 border-t border-border/70 pt-4" : "shrink-0 border-t border-border bg-background px-5 py-4"}>
        {error ? (
          <p role="alert" className="mb-3 type-helper text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          <p className="type-helper text-muted-foreground">
            {selectedDate && timeLabel ? (
              <span className="font-medium text-foreground">
                {formatLongDate(selectedDate)} · {timeLabel}
              </span>
            ) : selectedDate ? (
              "Choose a time for this day."
            ) : (
              "Choose an open day to continue."
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="lg" disabled={!selectedDate || !selectedTime || saving} onClick={() => void confirm()}>
              {saving ? "Saving…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
  );

  if (variant === "inline") {
    return (
      <div className="rounded-2xl bg-muted p-4">
        {schedule}
        {actions}
      </div>
    );
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-5 py-4">
        <div className="min-w-0">
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <p className="mt-0.5 truncate type-helper text-muted-foreground">{subtitle}</p>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Close booking">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
      </div>
      <DialogDescription className="sr-only">{description}</DialogDescription>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{schedule}</div>
      {actions}
    </>
  );
}
