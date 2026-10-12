"use client";

import { ChevronLeft, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import {
  getApiErrorMessage,
  listThreads,
  openVisitResult,
  postponeClinicianVisit,
  postponePatientVisit,
  readThread,
  sendMessage,
  type ChatMessage,
  type MessageThread,
  type ThreadDetail,
  type ThreadVisit,
  type VisitStatus,
} from "@/lib/api/visit-client";
import { formatAppointmentSlot } from "@/lib/format";

const STATUS_LABEL: Record<VisitStatus, string> = {
  BOOKED: "Booked",
  ARRIVED: "Showed up",
  NO_SHOW: "No-show",
  POSTPONED: "Postponed",
  COMPLETED: "Finished",
  CANCELLED: "Cancelled",
};

type TimelineItem =
  | { key: string; at: string; kind: "visit"; visit: ThreadVisit }
  | { key: string; at: string; kind: "message"; message: ChatMessage };

const COPY = {
  hcp: {
    intro: "Patients appear here after they book a visit.",
    search: "Search patients",
    emptySearch: "No patient matches that search.",
    empty: "No patients have booked yet.",
  },
  patient: {
    intro: "Clinicians appear here after you book a visit.",
    search: "Search clinicians",
    emptySearch: "No clinician matches that search.",
    empty: "You have not booked a visit yet.",
  },
} as const;

export function HcpMessageDesk({
  initialUserId,
  audience = "hcp",
}: {
  initialUserId?: number;
  audience?: "hcp" | "patient";
}) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<number | null>(initialUserId ?? null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listThreads()
      .then((response) => {
        if (!cancelled) setThreads(response.data);
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeId === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    readThread(activeId)
      .then((response) => {
        if (!cancelled) setDetail(response.data);
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((thread) => {
      const haystack = [thread.name, thread.email, thread.phone, thread.preview, thread.first?.reason, thread.next?.reason]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [threads, query]);

  const activeThread = threads.find((thread) => thread.user_id === activeId) ?? null;

  async function postpone(visitId: number, date: string, time: string) {
    if (activeId === null) return;
    setPending(true);
    setError(null);
    try {
      await (audience === "hcp" ? postponeClinicianVisit : postponePatientVisit)(visitId, date, time);
      const [thread, refreshed] = await Promise.all([readThread(activeId), listThreads()]);
      setDetail(thread.data);
      setThreads(refreshed.data);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function submit() {
    if (activeId === null || !draft.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await sendMessage(activeId, draft.trim());
      setDetail((current) =>
        current ? { ...current, messages: [...current.messages, response.data] } : current,
      );
      setDraft("");
      const refreshed = await listThreads();
      setThreads(refreshed.data);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {activeId === null ? (
        <PatientList
          ready={ready}
          query={query}
          threads={visible}
          copy={COPY[audience]}
          onQuery={setQuery}
          onOpen={setActiveId}
        />
      ) : (
        <PatientThread
          detail={detail}
          fallbackName={activeThread?.name ?? (audience === "hcp" ? "Patient" : "Clinician")}
          fallbackContact={[activeThread?.email, activeThread?.phone].filter(Boolean).join(" · ")}
          draft={draft}
          pending={pending}
          onDraft={setDraft}
          onBack={() => setActiveId(null)}
          onSubmit={() => void submit()}
          onPostpone={(visitId, date, time) => void postpone(visitId, date, time)}
          resultScope={audience}
        />
      )}
    </section>
  );
}

function PatientList({
  ready,
  query,
  threads,
  copy,
  onQuery,
  onOpen,
}: {
  ready: boolean;
  query: string;
  threads: MessageThread[];
  copy: (typeof COPY)["hcp"];
  onQuery: (value: string) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <>
      <div>
        <h1 className="type-h1 text-foreground">Messages</h1>
        <p className="mt-2 type-body text-muted-foreground">{copy.intro}</p>
      </div>
      <TextField id="patient-search" label={copy.search} value={query} onChange={onQuery} />
      {!ready ? (
        <p className="type-body text-muted-foreground">Loading…</p>
      ) : threads.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-10 text-center type-body text-muted-foreground shadow-soft">
          {query.trim() ? copy.emptySearch : copy.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((thread) => (
            <li key={thread.user_id}>
              <button
                type="button"
                className="w-full rounded-2xl bg-card px-5 py-4 text-left shadow-soft"
                onClick={() => onOpen(thread.user_id)}
              >
                <span className="block type-h3 text-foreground">{thread.name}</span>
                <span className="mt-1 block type-helper text-muted-foreground">
                  {[thread.email, thread.phone].filter(Boolean).join(" · ") || "No contact saved"}
                </span>
                <span className="mt-2 block type-body text-foreground">
                  {thread.next
                    ? `Next appointment · ${formatAppointmentSlot(thread.next.date, thread.next.time)}`
                    : `First booking · ${thread.first ? formatAppointmentSlot(thread.first.date, thread.first.time) : "Visit"}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PatientThread({
  detail,
  fallbackName,
  fallbackContact,
  draft,
  pending,
  onDraft,
  onBack,
  onSubmit,
  onPostpone,
  resultScope,
}: {
  detail: ThreadDetail | null;
  fallbackName: string;
  fallbackContact: string;
  draft: string;
  pending: boolean;
  onDraft: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onPostpone: (visitId: number, date: string, time: string) => void;
  resultScope: "hcp" | "patient";
}) {
  const patient = detail?.user;
  const name = patient?.name || fallbackName;
  const visits = detail?.visits ?? [];
  const first = [...visits].sort((left, right) => (left.created_at ?? "").localeCompare(right.created_at ?? ""))[0];
  const next = visits.find((visit) => visit.id !== first?.id && isUpcoming(visit)) ?? visits.find(isUpcoming);
  const timeline = buildTimeline(visits, detail?.messages ?? [], first?.id, next?.id);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
          All messages
        </Button>
        <div>
          <h1 className="type-h1 text-foreground">{name}</h1>
          <p className="mt-1 type-body text-muted-foreground">
            {[patient?.email, patient?.phone].filter(Boolean).join(" · ") || fallbackContact || "No contact saved"}
          </p>
        </div>
      </div>
      {!detail ? (
        <p className="type-body text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {first ? <BookingCard visit={first} email={patient?.email} phone={patient?.phone} /> : null}
          {timeline.map((item) =>
            item.kind === "visit" ? (
              <VisitCard key={item.key} visit={item.visit} resultScope={resultScope} />
            ) : (
              <p
                key={item.key}
                className={`max-w-[40rem] rounded-2xl px-4 py-3 type-body ${item.message.mine ? "self-end bg-primary text-primary-foreground" : "self-start bg-accent text-foreground"}`}
              >
                {item.message.body}
              </p>
            ),
          )}
          {next ? (
            <NextCard
              visit={next}
              pending={pending}
              note={resultScope === "patient" ? "You will come on another day." : "They will come on another day."}
              onPostpone={onPostpone}
            />
          ) : null}
          <form
            className="mt-2 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="min-w-0 flex-1">
              <TextField id="message-draft" label="Message" value={draft} onChange={onDraft} maxLength={2000} />
            </div>
            <Button type="submit" disabled={pending || !draft.trim()} aria-label="Send message">
              <Send aria-hidden="true" />
              Send
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

function BookingCard({
  visit,
  email,
  phone,
}: {
  visit: ThreadVisit;
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <article className="rounded-2xl bg-card p-5 shadow-soft">
      <h2 className="type-label text-primary">First booking</h2>
      <p className="mt-2 type-h3 text-foreground">{formatAppointmentSlot(visit.date, visit.time)}</p>
      <p className="mt-1 type-body text-foreground">{visit.reason || "Visit"}</p>
      <p className="mt-1 type-helper text-muted-foreground">{STATUS_LABEL[visit.status]}</p>
      <p className="mt-2 type-helper text-muted-foreground">
        Booked with {[email, phone].filter(Boolean).join(" · ") || "the details on their account"}
      </p>
    </article>
  );
}

function VisitCard({ visit, resultScope }: { visit: ThreadVisit; resultScope: "hcp" | "patient" }) {
  return (
    <article className="rounded-2xl bg-card p-5 shadow-soft">
      <h2 className="type-label text-muted-foreground">
        {formatAppointmentSlot(visit.date, visit.time)} · {STATUS_LABEL[visit.status]}
      </h2>
      <p className="mt-2 type-body text-foreground">{visit.reason || "Visit"}</p>
      {visit.summary ? (
        <div className="mt-3">
          <p className="type-label text-foreground">Visit summary</p>
          <p className="mt-1 type-body text-foreground">{visit.summary}</p>
        </div>
      ) : null}
      {visit.results.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {visit.results.map((result) => (
            <li key={result.id}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void openVisitResult(resultScope, visit.id, result.id)}
              >
                {result.title || result.file_name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function NextCard({
  visit,
  pending,
  note,
  onPostpone,
}: {
  visit: ThreadVisit;
  pending: boolean;
  note: string;
  onPostpone: (visitId: number, date: string, time: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const canMove = visit.status === "BOOKED" || visit.status === "POSTPONED";

  return (
    <article className="rounded-2xl bg-accent p-5">
      <h2 className="type-label text-primary">Next appointment</h2>
      <p className="mt-2 type-h3 text-foreground">{formatAppointmentSlot(visit.date, visit.time)}</p>
      <p className="mt-1 type-body text-foreground">
        {visit.reason || "Visit"} · {STATUS_LABEL[visit.status]}
      </p>
      {canMove ? (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start"
            aria-expanded={open}
            aria-controls="next-postpone"
            disabled={pending}
            onClick={() => setOpen((current) => !current)}
          >
            Postpone
          </Button>
          {open ? (
            <form
              id="next-postpone"
              className="grid max-w-sm gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                onPostpone(visit.id, date, time);
              }}
            >
              <p className="type-helper text-muted-foreground">{note}</p>
              <TextField id="next-postpone-date" label="Date" type="date" value={date} onChange={setDate} />
              <TextField id="next-postpone-time" label="Time" type="time" value={time} onChange={setTime} />
              <Button type="submit" size="sm" variant="outline" className="self-start" disabled={pending || !date || !time}>
                Move visit
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function isUpcoming(visit: ThreadVisit): boolean {
  if (visit.status !== "BOOKED" && visit.status !== "POSTPONED") return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const when = new Date(`${visit.date}T${visit.time}`);
  return !Number.isNaN(when.getTime()) && when >= start;
}

function buildTimeline(
  visits: ThreadVisit[],
  messages: ChatMessage[],
  firstId?: number,
  nextId?: number,
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...visits
      .filter((visit) => {
        if (visit.id === nextId || visit.id === firstId) {
          return Boolean(visit.summary) || visit.results.length > 0;
        }
        return true;
      })
      .map((visit) => ({
        key: `visit-${visit.id}`,
        at: `${visit.date}T${visit.time}`,
        kind: "visit" as const,
        visit,
      })),
    ...messages.map((message) => ({
      key: `message-${message.id}`,
      at: message.sent_at ?? "",
      kind: "message" as const,
      message,
    })),
  ];
  return items.sort((left, right) => left.at.localeCompare(right.at));
}
