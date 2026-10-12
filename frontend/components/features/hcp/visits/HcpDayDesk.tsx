"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import {
  getApiErrorMessage,
  listClinicianVisits,
  offerFollowUp,
  openVisitResult,
  postponeClinicianVisit,
  saveVisitSummary,
  setVisitStatus,
  uploadVisitResult,
  type Visit,
  type VisitStatus,
} from "@/lib/api/visit-client";
import { formatClockTime, formatLongDate } from "@/lib/format";

const STATUS_LABEL: Record<VisitStatus, string> = {
  BOOKED: "Booked",
  ARRIVED: "Showed up",
  NO_SHOW: "No-show",
  POSTPONED: "Postponed",
  COMPLETED: "Visit went well",
  CANCELLED: "Cancelled",
};

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function shiftDay(iso: string, delta: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function clockNow(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function minutes(clock: string): number {
  const [hours, mins] = clock.split(":").map(Number);
  return hours * 60 + mins;
}

function shortDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function closestVisit(list: Visit[], time: string): { visit: Visit; exact: boolean } | null {
  if (!time || list.length === 0) return null;
  const target = time.slice(0, 5);
  const exact = list.find((visit) => visitClock(visit.time) === target);
  if (exact) return { visit: exact, exact: true };

  let closest = list[0];
  let best = Math.abs(minutes(visitClock(list[0].time)) - minutes(target));
  for (const visit of list.slice(1)) {
    const delta = Math.abs(minutes(visitClock(visit.time)) - minutes(target));
    if (delta < best) {
      best = delta;
      closest = visit;
    }
  }
  return { visit: closest, exact: false };
}

function visitClock(time: string): string {
  return time.slice(0, 5);
}

export function HcpDayDesk() {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [day, setDay] = useState(todayIso);
  const [queryTime, setQueryTime] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState("");
  const [title, setTitle] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moveTime, setMoveTime] = useState("");
  const [reason, setReason] = useState("Follow-up visit");

  async function reload(prefer?: number) {
    const response = await listClinicianVisits();
    setVisits(response.data);
    if (prefer) setSelectedId(prefer);
  }

  useEffect(() => {
    reload().catch((cause) => setError(getApiErrorMessage(cause)));
  }, []);

  const today = todayIso();
  const isToday = day === today;
  const dayVisits = useMemo(
    () =>
      (visits ?? [])
        .filter((visit) => visit.date === day && visit.status !== "CANCELLED")
        .sort((left, right) => visitClock(left.time).localeCompare(visitClock(right.time))),
    [visits, day],
  );

  const stillDue = dayVisits.filter(
    (visit) => visit.status === "BOOKED" || visit.status === "POSTPONED",
  );
  const overdue = isToday ? stillDue.find((visit) => visitClock(visit.time) < clockNow()) : undefined;
  const nextVisit = overdue ?? (isToday
    ? stillDue.find((visit) => visitClock(visit.time) >= clockNow())
    : stillDue[0]);
  const timeMatch = useMemo(() => closestVisit(dayVisits, queryTime), [dayVisits, queryTime]);
  const selected = dayVisits.find((visit) => visit.id === selectedId) ?? null;
  const bookedDays = useMemo(() => {
    const counts = new Map<string, number>();
    for (const visit of visits ?? []) {
      if (visit.status === "CANCELLED") continue;
      counts.set(visit.date, (counts.get(visit.date) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [visits]);

  useEffect(() => {
    setSelectedId((current) => {
      if (current && dayVisits.some((visit) => visit.id === current)) return current;
      return null;
    });
  }, [day, dayVisits]);

  useEffect(() => {
    if (!queryTime || !timeMatch) return;
    document.getElementById(`visit-${timeMatch.visit.id}`)?.scrollIntoView({ block: "nearest" });
  }, [queryTime, day, timeMatch]);

  useEffect(() => {
    setSummary(selected?.summary ?? "");
  }, [selected?.id, selected?.summary]);

  async function run(action: () => Promise<unknown>, prefer?: number) {
    setPending(true);
    setError(null);
    try {
      await action();
      await reload(prefer);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  const heading = isToday ? "Today" : (formatLongDate(day) ?? day);
  const weekday = formatLongDate(day);
  const morning = dayVisits.filter((visit) => Number(visitClock(visit.time).slice(0, 2)) < 12);
  const afternoon = dayVisits.filter((visit) => Number(visitClock(visit.time).slice(0, 2)) >= 12);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-h1 text-foreground">{heading}</h1>
          <p className="mt-1 type-body text-muted-foreground">
            {isToday ? weekday : "Visits for this day"}
            {dayVisits.length > 0
              ? ` · ${dayVisits.length} ${dayVisits.length === 1 ? "visit" : "visits"}`
              : ""}
          </p>
          {nextVisit ? (
            <p className="mt-1 type-label text-primary">
              {overdue
                ? `${nextVisit.patient.name} was booked at ${formatClockTime(visitClock(nextVisit.time))}`
                : `${isToday ? "Next" : "First"} is ${nextVisit.patient.name} at ${formatClockTime(visitClock(nextVisit.time))}`}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={searchOpen ? "default" : "outline"}
            aria-expanded={searchOpen}
            aria-controls="desk-search"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search aria-hidden="true" />
            Search
          </Button>
          <Button type="button" size="sm" variant="outline" aria-label="Previous day" onClick={() => setDay((current) => shiftDay(current, -1))}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          {isToday ? null : (
            <Button type="button" size="sm" variant="outline" onClick={() => setDay(today)}>
              Today
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" aria-label="Next day" onClick={() => setDay((current) => shiftDay(current, 1))}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      {searchOpen ? (
      <form
        id="desk-search"
        className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-soft"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,10rem)_auto] sm:items-end">
          <TextField
            id="desk-day"
            label="Day"
            type="date"
            value={day}
            onChange={(value) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setDay(value);
            }}
          />
          <TextField
            id="desk-time"
            label="Time"
            type="time"
            value={queryTime}
            onChange={setQueryTime}
          />
          {queryTime ? (
            <Button type="button" size="sm" variant="outline" className="mb-0.5" onClick={() => setQueryTime("")}>
              Clear time
            </Button>
          ) : null}
        </div>
        {queryTime && dayVisits.length === 0 ? (
          <p className="type-body text-muted-foreground">Nothing is booked on this day.</p>
        ) : null}
        {timeMatch && !timeMatch.exact ? (
          <p className="type-body text-muted-foreground">
            No visit at {formatClockTime(queryTime.slice(0, 5))}. Closest is {timeMatch.visit.patient.name} at{" "}
            {formatClockTime(visitClock(timeMatch.visit.time))}.
          </p>
        ) : null}
        {timeMatch?.exact ? (
          <p className="type-label text-primary">
            {timeMatch.visit.patient.name} at {formatClockTime(visitClock(timeMatch.visit.time))}
          </p>
        ) : null}
        {bookedDays.length > 0 ? (
          <div>
            <p className="type-label text-muted-foreground">Days with visits</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {bookedDays.map(([iso, count]) => (
                <Button
                  key={iso}
                  type="button"
                  size="sm"
                  variant={iso === day ? "default" : "outline"}
                  aria-pressed={iso === day}
                  onClick={() => setDay(iso)}
                >
                  {shortDay(iso)} · {count}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
      ) : null}

      {error ? <Callout tone="danger">{error}</Callout> : null}

      {visits === null ? (
        <p className="type-body text-muted-foreground">Loading the day…</p>
      ) : dayVisits.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-10 text-center type-body text-muted-foreground shadow-soft">
          Nothing is booked for this day.
        </p>
      ) : (
        <div className="grid items-start gap-x-4 gap-y-2 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <DayGroup
            label="Morning"
            visits={morning}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <DayGroup
            label="Afternoon"
            visits={afternoon}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-2 lg:row-span-8">
            {selected ? (
              <VisitPanel
                visit={selected}
                pending={pending}
                summary={summary}
                title={title}
                moveDate={moveDate}
                moveTime={moveTime}
                reason={reason}
                onSummary={setSummary}
                onTitle={setTitle}
                onMoveDate={setMoveDate}
                onMoveTime={setMoveTime}
                onReason={setReason}
                onRun={run}
              />
            ) : (
              <p className="rounded-2xl bg-card px-5 py-8 type-body text-muted-foreground shadow-soft">
                Select a card to change the status.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DayGroup({
  label,
  visits,
  selectedId,
  onSelect,
}: {
  label: string;
  visits: Visit[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (visits.length === 0) return null;

  return (
    <div className="contents">
      <h2 className="type-label text-muted-foreground lg:col-start-1">{label}</h2>
      <ul className="flex flex-col gap-2 lg:col-start-1">
        {visits.map((visit) => {
          const selected = visit.id === selectedId;
          return (
            <li key={visit.id} id={`visit-${visit.id}`}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(visit.id)}
                className={
                  selected
                    ? "grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-2xl bg-card py-5 pr-5 pl-8 text-left shadow-soft ring-2 ring-primary"
                    : "grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-2xl bg-card py-5 pr-5 pl-8 text-left shadow-soft"
                }
              >
                <time className="type-label text-primary" dateTime={`${visit.date}T${visitClock(visit.time)}`}>
                  {formatClockTime(visitClock(visit.time))}
                </time>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <span className="min-w-0">
                    <span className="block type-h3 text-foreground">{visit.patient.name}</span>
                    <span className="mt-0.5 block type-helper text-muted-foreground">
                      {visit.reason || "Visit"}
                    </span>
                    <span className="mt-1 block type-helper text-muted-foreground">
                      {visit.patient.email || "No email"}
                    </span>
                    <span className="block type-helper text-muted-foreground">
                      {visit.patient.phone || "No phone"}
                    </span>
                  </span>
                  <span className="type-label text-muted-foreground">{STATUS_LABEL[visit.status]}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VisitPanel({
  visit,
  pending,
  summary,
  title,
  moveDate,
  moveTime,
  reason,
  onSummary,
  onTitle,
  onMoveDate,
  onMoveTime,
  onReason,
  onRun,
}: {
  visit: Visit;
  pending: boolean;
  summary: string;
  title: string;
  moveDate: string;
  moveTime: string;
  reason: string;
  onSummary: (value: string) => void;
  onTitle: (value: string) => void;
  onMoveDate: (value: string) => void;
  onMoveTime: (value: string) => void;
  onReason: (value: string) => void;
  onRun: (action: () => Promise<unknown>, prefer?: number) => void;
}) {
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [summaryEdit, setSummaryEdit] = useState(false);
  const movable = visit.status === "BOOKED" || visit.status === "POSTPONED";
  const arrived = visit.status === "ARRIVED";
  const missed = visit.status === "NO_SHOW";
  const finished = visit.status === "COMPLETED";
  const seen = arrived || finished;
  const showSummaryForm = arrived || (finished && (!visit.summary || summaryEdit));

  useEffect(() => {
    setPostponeOpen(false);
    setResultOpen(false);
    setFollowOpen(false);
    setSummaryEdit(false);
  }, [visit.id, visit.status]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft">
      <div>
        <h2 className="type-h3 text-foreground">{visit.patient.name}</h2>
        <p className="mt-1 type-body text-muted-foreground">
          {formatClockTime(visitClock(visit.time))} · {visit.reason || "Visit"} · {STATUS_LABEL[visit.status]}
        </p>
      </div>
      {movable ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onRun(() => setVisitStatus(visit.id, "ARRIVED"), visit.id)}>
            Showed up
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onRun(() => setVisitStatus(visit.id, "NO_SHOW"), visit.id)}>
            No-show
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-expanded={postponeOpen}
            aria-controls="postpone-visit"
            disabled={pending}
            onClick={() => setPostponeOpen((open) => !open)}
          >
            Postpone
          </Button>
        </div>
      ) : null}
      {movable && postponeOpen ? (
        <form
          id="postpone-visit"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onRun(() => postponeClinicianVisit(visit.id, moveDate, moveTime), visit.id);
          }}
        >
          <p className="type-helper text-muted-foreground">They will come on another day.</p>
          <TextField id="postpone-date" label="Date" type="date" value={moveDate} onChange={onMoveDate} />
          <TextField id="postpone-time" label="Time" type="time" value={moveTime} onChange={onMoveTime} />
          <Button type="submit" size="sm" variant="outline" disabled={pending || !moveDate || !moveTime}>
            Move visit
          </Button>
        </form>
      ) : null}
      {missed ? (
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onRun(() => setVisitStatus(visit.id, "BOOKED"), visit.id)}
          >
            Undo
          </Button>
          <p className="type-helper text-muted-foreground">Puts this visit back to booked.</p>
        </div>
      ) : null}
      {finished && visit.summary ? (
        <div>
          <p className="type-label text-foreground">Summary sent</p>
          <p className="mt-1 type-body text-foreground">{visit.summary}</p>
        </div>
      ) : null}
      {showSummaryForm ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onRun(() => saveVisitSummary(visit.id, summary), visit.id);
          }}
        >
          <label htmlFor="visit-summary" className="type-label text-foreground">
            Visit summary
          </label>
          <p className="type-helper text-muted-foreground">
            Sending this finishes the visit. The patient sees it on Appointments.
          </p>
          <textarea
            id="visit-summary"
            value={summary}
            onChange={(event) => onSummary(event.target.value)}
            rows={4}
            className="rounded-xl border border-input bg-background px-3 py-2 type-body text-foreground"
          />
          <Button type="submit" size="sm" disabled={pending || !summary.trim()}>
            Send summary
          </Button>
        </form>
      ) : null}
      {finished && visit.summary && !summaryEdit ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setSummaryEdit(true)}>
          Update summary
        </Button>
      ) : null}
      {seen ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={resultOpen}
          aria-controls="visit-result"
          onClick={() => setResultOpen((open) => !open)}
        >
          Send a result
        </Button>
      ) : null}
      {seen && resultOpen ? (
        <form
          id="visit-result"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const file = new FormData(event.currentTarget).get("file");
            if (!(file instanceof File) || file.size === 0) return;
            onRun(() => uploadVisitResult(visit.id, file, title), visit.id);
          }}
        >
          <TextField id="result-title" label="Result title" value={title} onChange={onTitle} />
          <input name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="type-helper" />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Send result
          </Button>
        </form>
      ) : null}
      {visit.results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visit.results.map((result) => (
            <li key={result.id}>
              <Button type="button" size="sm" variant="ghost" onClick={() => void openVisitResult("hcp", visit.id, result.id)}>
                {result.title || result.file_name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {finished ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={followOpen}
          aria-controls="visit-follow-up"
          onClick={() => setFollowOpen((open) => !open)}
        >
          Book a follow-up
        </Button>
      ) : null}
      {finished && followOpen ? (
        <form
          id="visit-follow-up"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onRun(() => offerFollowUp(visit.id, moveDate, moveTime, reason));
          }}
        >
          <TextField id="follow-date" label="Date" type="date" value={moveDate} onChange={onMoveDate} />
          <TextField id="follow-time" label="Time" type="time" value={moveTime} onChange={onMoveTime} />
          <TextField id="follow-reason" label="Reason" value={reason} onChange={onReason} />
          <Button type="submit" size="sm" disabled={pending || !moveDate || !moveTime}>
            Offer follow-up
          </Button>
        </form>
      ) : null}
      {arrived ? (
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onRun(() => setVisitStatus(visit.id, "BOOKED"), visit.id)}
          >
            Undo
          </Button>
          <p className="type-helper text-muted-foreground">Puts this visit back to booked.</p>
        </div>
      ) : null}
    </div>
  );
}
