"use client";

import {
  Banknote,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/ui/text-field";
import { savePatientPhone } from "@/lib/api/patient-client";
import { formatCalendarDate, formatClockTime, formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bookVisit, clinicianSlots, getApiErrorMessage } from "@/lib/api/visit-client";
import { useAppointmentStore } from "@/store/use-appointment-store";
import type { HCP } from "@/types/hcp-directory";

export type BookingPatient = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const TIME_SLOTS = buildTimeSlots();

export function PatientBookingPanel({
  doctor,
  patient,
  onClose,
}: {
  doctor: HCP | null;
  patient: BookingPatient;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={doctor !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="top-0 right-0 bottom-0 left-auto flex h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l border-border bg-muted p-0 ring-0 sm:max-w-lg sm:rounded-l-3xl sm:p-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
        {doctor ? (
          <BookingForm key={doctor.id} doctor={doctor} patient={patient} onClose={onClose} />
        ) : (
          <DialogTitle className="sr-only">Book appointment</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookingForm({
  doctor,
  patient,
  onClose,
}: {
  doctor: HCP;
  patient: BookingPatient;
  onClose: () => void;
}) {
  const addAppointment = useAppointmentStore((state) => state.addAppointment);
  const live = /^\d+$/.test(doctor.id);
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    clinicianSlots(doctor.id)
      .then((response) => {
        if (!cancelled) setSlots(response.data);
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [doctor.id, live]);

  const location = [doctor.area, doctor.city].filter(Boolean).join(", ");
  const times = live
    ? (selectedDate ? (slots?.[selectedDate] ?? []) : []).map((value) => ({
        value,
        label: formatClockTime(value),
      }))
    : TIME_SLOTS;
  const timeLabel = times.find((slot) => slot.value === selectedTime)?.label;
  const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(" ");

  async function confirm() {
    const phoneValue = phone.trim();
    if (phoneValue.replace(/\D/g, "").length < 6) {
      setError("Add a phone number so the clinic can call you.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError("Choose a date and a time.");
      return;
    }

    const reason = notes.trim();

    if (live) {
      setSaving(true);
      setError(null);
      try {
        if (phoneValue !== (patient.phone ?? "").trim()) {
          await savePatientPhone(phoneValue);
        }
        await bookVisit({
          clinicianId: Number(doctor.id),
          date: selectedDate,
          time: selectedTime,
          reason,
        });
        setBooked(true);
      } catch (cause) {
        setError(getApiErrorMessage(cause));
      } finally {
        setSaving(false);
      }
      return;
    }

    addAppointment({
      doctorName: doctor.fullName,
      specialty: doctor.specialties[0] ?? "Visit",
      location: location || "Clinic",
      date: selectedDate,
      time: selectedTime,
      reason,
    });
    setError(null);
    setBooked(true);
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-5 py-4">
        <div className="min-w-0">
          <DialogTitle className="text-foreground">
            {booked ? "Visit requested" : "Book appointment"}
          </DialogTitle>
          <p className="mt-0.5 truncate type-helper text-muted-foreground">
            {booked
              ? "Saved with your appointments."
              : `${doctor.fullName} · ${live ? "30 minutes" : "1 hour"}`}
          </p>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Close booking">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
      </div>

      <DialogDescription className="sr-only">
        Book a visit with {doctor.fullName}.
      </DialogDescription>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {booked && selectedDate && timeLabel ? (
          <Confirmation
            doctor={doctor}
            location={location}
            date={selectedDate}
            time={timeLabel}
            length={live ? "30 minutes" : "1 hour"}
            notes={notes.trim()}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <DoctorCard doctor={doctor} location={location} />

            <section className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70">
              <h3 className="type-label text-foreground">Your details</h3>
              <p className="mt-1 type-helper text-muted-foreground">
                The clinic uses your name and phone if they need to reach you.
              </p>
              <IdentityCard patient={patient} name={patientName} />
              <div className="mt-4">
                <TextField
                  id="booking-phone"
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder="+961…"
                />
              </div>
            </section>

            <section className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="type-label text-foreground">When</h3>
                <p className="type-helper text-muted-foreground">
                  {selectedDate ? formatLongDate(selectedDate) : "Open days are highlighted"}
                </p>
              </div>
              <MonthCalendar
                month={month}
                today={today}
                selected={selectedDate}
                openDates={live ? new Set(Object.keys(slots ?? {})) : undefined}
                onMonth={setMonth}
                onSelect={(value) => {
                  setSelectedDate(value);
                  setSelectedTime(null);
                  setError(null);
                }}
              />
              <div className="mt-4 border-t border-border/70 pt-4">
                {selectedDate ? (
                  <>
                    <p className="type-label text-foreground">Available times</p>
                    <p className="mt-1 type-helper text-muted-foreground">
                      {live ? "Each visit is 30 minutes, inside the clinic hours." : "Each visit lasts one hour."}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {times.length === 0 ? (
                        <p className="col-span-3 type-helper text-muted-foreground">
                          No open times on this day.
                        </p>
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

            <section className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70">
              <Label htmlFor="booking-notes">
                Notes
                <span className="ml-2 font-normal text-muted-foreground">Optional</span>
              </Label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Anything the doctor should know before the visit."
                className="mt-2 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 type-body text-foreground outline-none placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
              />
            </section>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-background px-5 py-4">
        {error ? (
          <p role="alert" className="mb-3 type-helper text-destructive">
            {error}
          </p>
        ) : null}
        {booked && selectedDate ? (
          <Button type="button" className="w-full" size="lg" asChild>
            <Link href={`/patient/home?day=${selectedDate}`}>See this visit</Link>
          </Button>
        ) : (
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
              <Button
                type="button"
                size="lg"
                disabled={!selectedDate || !selectedTime || saving}
                onClick={confirm}
              >
                {saving ? "Booking…" : "Confirm visit"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DoctorCard({ doctor, location }: { doctor: HCP; location: string }) {
  const initials = doctor.fullName
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-lg text-primary"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate type-h3 text-foreground">{doctor.fullName}</p>
          <p className="type-helper text-muted-foreground">{doctor.specialties[0]}</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {location ? <MetaChip icon={MapPin} label={location} /> : null}
        {doctor.waitingTime ? <MetaChip icon={Clock3} label={doctor.waitingTime} /> : null}
        {doctor.fees !== undefined ? (
          <MetaChip icon={Banknote} label={`${doctor.fees} ${doctor.currency ?? ""}`.trim()} tone="accent" />
        ) : null}
      </ul>
    </article>
  );
}

function MetaChip({
  icon: Icon,
  label,
  tone = "muted",
}: {
  icon: typeof MapPin;
  label: string;
  tone?: "muted" | "accent";
}) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-helper",
        tone === "accent" ? "bg-accent text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </li>
  );
}

function IdentityCard({ patient, name }: { patient: BookingPatient; name: string }) {
  const rows = [
    { icon: CalendarDays, label: "Date of birth", value: formatCalendarDate(patient.birthDate) ?? "Not added" },
    { icon: UserRound, label: "Gender", value: genderLabel(patient.gender) ?? "Not added" },
    { icon: Mail, label: "Email", value: patient.email || "Not added" },
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-accent">
      <p className="px-3 pt-3 type-helper font-medium text-primary">From your account</p>
      <p className="px-3 pb-2 type-h4 text-foreground">{name || "Your profile"}</p>
      <ul className="bg-background/70">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 border-t border-secondary/15 px-3 py-2.5">
            <row.icon className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="type-helper text-muted-foreground">{row.label}</span>
            <span className="ml-auto min-w-0 truncate text-right type-helper font-medium text-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Confirmation({
  doctor,
  location,
  date,
  time,
  length,
  notes,
}: {
  doctor: HCP;
  location: string;
  date: string;
  time: string;
  length: string;
  notes: string;
}) {
  const rows = [
    { label: "Clinician", value: doctor.fullName },
    { label: "When", value: `${formatLongDate(date)} · ${time}` },
    { label: "Length", value: length },
    { label: "Where", value: location || "Clinic" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center px-2 pt-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <Check className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-4 type-h3 text-foreground">You’re booked</p>
        <p className="mt-1 max-w-xs type-body text-muted-foreground">
          {doctor.specialties[0] ?? "This visit"} with {doctor.fullName} is on your account.
        </p>
      </div>
      <dl className="overflow-hidden rounded-2xl bg-background shadow-card ring-1 ring-border/70">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border/70 px-4 py-3 last:border-b-0">
            <dt className="type-helper text-muted-foreground">{row.label}</dt>
            <dd className="text-right type-helper font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
        {notes ? (
          <div className="border-t border-border/70 px-4 py-3">
            <dt className="type-helper text-muted-foreground">Notes</dt>
            <dd className="mt-1 type-body text-foreground">{notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function MonthCalendar({
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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function genderLabel(value: string | null): string | null {
  if (!value) return null;
  if (value === "MALE" || value === "male") return "Male";
  if (value === "FEMALE" || value === "female") return "Female";
  return value;
}

function slotLabel(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function buildTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 12; hour <= 20; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 20 && minute === 30) continue;
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({ value, label: slotLabel(hour, minute) });
    }
  }
  return slots;
}
