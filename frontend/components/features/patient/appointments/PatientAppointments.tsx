"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VisitTimePicker } from "@/components/features/visits/VisitTimeSheet";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import {
  cancelPatientVisit,
  clinicianSlots,
  getApiErrorMessage,
  listPatientVisits,
  openVisitResult,
  postponePatientVisit,
  type Visit,
} from "@/lib/api/visit-client";
import { ROUTES } from "@/lib/constants/routes";
import { formatClockTime, formatLongDate } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

type AppointmentFilter = "upcoming" | "past" | "all";

const FILTERS: { value: AppointmentFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  upcoming: "Booked",
  postponed: "Postponed",
  arrived: "Showed up",
  no_show: "No-show",
  completed: "Completed",
  cancelled: "Cancelled",
};

const API_STATUS: Record<Visit["status"], AppointmentStatus> = {
  BOOKED: "upcoming",
  POSTPONED: "postponed",
  ARRIVED: "arrived",
  NO_SHOW: "no_show",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

function formatSpecialty(value: string | null | undefined): string {
  if (!value) return "Visit";
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toAppointment(visit: Visit): Appointment {
  return {
    id: String(visit.id),
    clinicianId: visit.clinician.id,
    doctorName: visit.clinician.name,
    email: visit.clinician.email,
    phone: visit.clinician.phone,
    specialty: formatSpecialty(visit.clinician.specialty),
    location: visit.clinician.location || "Clinic",
    date: visit.date,
    time: visit.time,
    reason: visit.reason || "Consultation",
    status: API_STATUS[visit.status],
    summary: visit.summary,
    results: visit.results.map((result) => ({
      id: result.id,
      title: result.title || result.file_name,
    })),
  };
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isPast(appointment: Appointment): boolean {
  if (
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show"
  ) {
    return true;
  }
  return appointment.date < todayIso();
}

function canManage(appointment: Appointment): boolean {
  return appointment.status === "upcoming" || appointment.status === "postponed";
}

function minutes(time: string): number {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

function closestVisit(
  list: Appointment[],
  time: string,
): { visit: Appointment; exact: boolean } | null {
  if (!time || list.length === 0) return null;
  const target = minutes(time);
  let best = list[0];
  let bestDelta = Math.abs(minutes(best.time) - target);
  for (const item of list.slice(1)) {
    const delta = Math.abs(minutes(item.time) - target);
    if (delta < bestDelta) {
      best = item;
      bestDelta = delta;
    }
  }
  return { visit: best, exact: bestDelta === 0 };
}

export function PatientAppointments({ initialDay = "" }: { initialDay?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AppointmentFilter>("upcoming");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dayQuery, setDayQuery] = useState(initialDay);
  const [timeQuery, setTimeQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  /**
   * Re-read the patient's visits.
   *
   * Memoised because the mount effect below depends on it: a plain function is a new
   * reference on every render, so the effect would re-run continuously instead of
   * fetching once. Handlers that call it after a mutation use it directly, so they
   * do not need it in their own dependency lists.
   */
  const reload = useCallback(async () => {
    const response = await listPatientVisits();
    setAppointments(response.data.map(toAppointment));
  }, []);

  useEffect(() => {
    reload().catch((cause) => setLoadError(getApiErrorMessage(cause)));
  }, [reload]);

  const bookedDays = useMemo(() => {
    const counts = new Map<string, number>();
    for (const appointment of appointments) {
      if (appointment.status === "cancelled") continue;
      counts.set(appointment.date, (counts.get(appointment.date) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [appointments]);

  const visible = useMemo(() => {
    const filtered = appointments.filter((appointment) => {
      if (dayQuery) return appointment.date === dayQuery;
      if (filter === "upcoming") return !isPast(appointment);
      if (filter === "past") return isPast(appointment);
      return true;
    });
    return filtered.sort((left, right) => {
      const leftKey = `${left.date}T${left.time}`;
      const rightKey = `${right.date}T${right.time}`;
      return filter === "past" && !dayQuery
        ? rightKey.localeCompare(leftKey)
        : leftKey.localeCompare(rightKey);
    });
  }, [appointments, filter, dayQuery]);

  const groups = useMemo(() => {
    const byDay = new Map<string, Appointment[]>();
    for (const appointment of visible) {
      const day = byDay.get(appointment.date) ?? [];
      day.push(appointment);
      byDay.set(appointment.date, day);
    }
    return [...byDay.entries()];
  }, [visible]);

  const timeMatch = useMemo(() => closestVisit(visible, timeQuery), [visible, timeQuery]);
  const selected = visible.find((appointment) => appointment.id === selectedId) ?? null;
  const cancelling = appointments.find((appointment) => appointment.id === cancelId);

  useEffect(() => {
    if (!timeMatch) return;
    setSelectedId(timeMatch.visit.id);
  }, [timeMatch]);

  useEffect(() => {
    if (selectedId && !visible.some((appointment) => appointment.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, selectedId]);

  return (
    <section
      id="appointments"
      aria-labelledby="appointments-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="appointments-heading" className="type-h1 text-foreground">
            Your appointments
          </h1>
          <p className="mt-2 type-body text-muted-foreground">
            Select a visit to postpone it, cancel it, or read the summary.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={searchOpen ? "default" : "outline"}
            aria-expanded={searchOpen}
            aria-controls="appointment-search"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search aria-hidden="true" />
            Search
          </Button>
          <Button type="button" asChild>
            <Link href={ROUTES.home}>Book a visit</Link>
          </Button>
        </div>
      </div>

      {loadError ? <Callout tone="danger">{loadError}</Callout> : null}
      {actionError ? <Callout tone="danger">{actionError}</Callout> : null}

      {searchOpen ? (
        <form
          id="appointment-search"
          className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-soft"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,10rem)_auto] sm:items-end">
            <TextField
              id="appointment-day"
              label="Day"
              type="date"
              value={dayQuery}
              onChange={(value) => {
                if (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)) setDayQuery(value);
              }}
            />
            <TextField
              id="appointment-time"
              label="Time"
              type="time"
              value={timeQuery}
              onChange={setTimeQuery}
            />
            {dayQuery || timeQuery ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mb-0.5"
                onClick={() => {
                  setDayQuery("");
                  setTimeQuery("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
          {timeMatch && !timeMatch.exact ? (
            <p className="type-body text-muted-foreground">
              No visit at {formatClockTime(timeQuery.slice(0, 5))}. Closest is{" "}
              {timeMatch.visit.doctorName} at {formatClockTime(timeMatch.visit.time)}.
            </p>
          ) : null}
          {bookedDays.length > 0 ? (
            <div>
              <p className="type-label text-foreground">Days with visits</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {bookedDays.map(([date, count]) => (
                  <Button
                    key={date}
                    type="button"
                    size="sm"
                    variant={dayQuery === date ? "default" : "outline"}
                    onClick={() => setDayQuery(date)}
                  >
                    {formatLongDate(date)} · {count}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      ) : null}

      <fieldset className="border-0 p-0">
        <legend className="sr-only">Filter appointments</legend>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const pressed = !dayQuery && filter === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={pressed ? "default" : "outline"}
                aria-pressed={pressed}
                onClick={() => {
                  setDayQuery("");
                  setFilter(item.value);
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {dayQuery ? (
        <p className="type-body text-muted-foreground">
          Showing {formatLongDate(dayQuery)}.{" "}
          <button type="button" className="type-label text-primary" onClick={() => setDayQuery("")}>
            Show upcoming
          </button>
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-accent px-5 py-10 text-center type-body text-muted-foreground">
          No appointments in this list yet.
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-5">
            {groups.map(([date, dayVisits]) => (
              <section key={date} className="flex flex-col gap-2">
                <h2 className="type-label text-foreground">{formatLongDate(date)}</h2>
                <ul className="flex flex-col gap-2">
                  {dayVisits.map((appointment) => {
                    const open = appointment.id === selected?.id;
                    return (
                      <li key={appointment.id} id={`visit-${appointment.id}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(appointment.id)}
                          className={`grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-2xl bg-card py-5 pr-5 pl-8 text-left shadow-soft ${open ? "ring-2 ring-primary" : ""}`}
                        >
                          <p className="type-label text-foreground">
                            {formatClockTime(appointment.time)}
                          </p>
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <h2 className="type-h3 text-foreground">{appointment.doctorName}</h2>
                              <span className="shrink-0 type-label text-muted-foreground">
                                {STATUS_LABEL[appointment.status]}
                              </span>
                            </div>
                            <p className="mt-1 type-body text-muted-foreground">
                              {appointment.specialty}
                            </p>
                            <p className="mt-2 type-label text-muted-foreground">
                              {appointment.email || "No email"}
                            </p>
                            <p className="type-label text-muted-foreground">
                              {appointment.phone || "No phone"}
                            </p>
                            <p className="mt-2 type-label text-muted-foreground">
                              {formatLongDate(appointment.date)} · {appointment.location}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          <div className="lg:sticky lg:top-24">
            {selected ? (
              <VisitPanel
                // Remount when the visit itself changes, rather than resetting the
                // panel's open state from an effect. Selecting a different visit,
                // or the same visit after a postpone, then starts from clean state
                // instead of inheriting the previous visit's picker.
                key={`${selected.id}:${selected.date}:${selected.time}:${selected.status}`}
                appointment={selected}
                onPostpone={async (date, time) => {
                  setActionError(null);
                  await postponePatientVisit(Number(selected.id), date, time);
                  await reload();
                }}
                onCancel={() => setCancelId(selected.id)}
              />
            ) : (
              <p className="rounded-2xl bg-card px-5 py-8 type-body text-muted-foreground shadow-soft">
                Select a card to manage this visit.
              </p>
            )}
          </div>
        </div>
      )}

      <CancelAppointmentDialog
        appointment={cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        onConfirm={async () => {
          if (!cancelling) return;
          setActionError(null);
          try {
            await cancelPatientVisit(Number(cancelling.id));
            await reload();
            setCancelId(null);
            setSelectedId(null);
          } catch (cause) {
            setActionError(getApiErrorMessage(cause));
          }
        }}
      />
    </section>
  );
}

function VisitPanel({
  appointment,
  onPostpone,
  onCancel,
}: {
  appointment: Appointment;
  onPostpone: (date: string, time: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [postponeOpen, setPostponeOpen] = useState(false);

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft">
      <div>
        <p className="type-label text-muted-foreground">{STATUS_LABEL[appointment.status]}</p>
        <h2 className="mt-1 type-h3 text-foreground">{appointment.doctorName}</h2>
        <p className="mt-1 type-body text-muted-foreground">{appointment.specialty}</p>
        <p className="mt-3 type-label text-muted-foreground">{appointment.email || "No email"}</p>
        <p className="type-label text-muted-foreground">{appointment.phone || "No phone"}</p>
      </div>
      <p className="type-body text-foreground">
        {formatLongDate(appointment.date)} at {formatClockTime(appointment.time)}
      </p>
      <p className="type-body text-muted-foreground">{appointment.location}</p>
      <p className="type-body text-foreground">{appointment.reason}</p>
      {appointment.summary ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="type-label text-foreground">Summary</p>
            <p className="mt-1 type-body text-foreground">{appointment.summary}</p>
          </div>
          {appointment.clinicianId ? (
            <Button type="button" variant="outline" asChild>
              <Link href={`${ROUTES.patientMessages}?with=${appointment.clinicianId}`}>
                Ask about this visit
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      {appointment.results && appointment.results.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="type-label text-foreground">Results</p>
          {appointment.results.map((result) => (
            <Button
              key={result.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void openVisitResult("patient", Number(appointment.id), result.id)}
            >
              {result.title}
            </Button>
          ))}
        </div>
      ) : null}
      {canManage(appointment) ? (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => setPostponeOpen((open) => !open)}>
            Postpone
          </Button>
          {appointment.clinicianId && postponeOpen ? (
            <VisitTimePicker
              confirmLabel="Move visit"
              loadSlots={() => clinicianSlots(String(appointment.clinicianId))}
              onClose={() => setPostponeOpen(false)}
              onConfirm={onPostpone}
            />
          ) : null}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel visit
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function CancelAppointmentDialog({
  appointment,
  onOpenChange,
  onConfirm,
}: {
  appointment?: Appointment;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={appointment !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        {appointment ? (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Cancel this visit?</DialogTitle>
              <DialogDescription>
                {appointment.doctorName} on {formatLongDate(appointment.date)} will be marked as
                cancelled.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Keep appointment
              </Button>
              <Button type="button" variant="destructive" onClick={onConfirm}>
                Cancel visit
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
