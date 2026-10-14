"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AppointmentCard,
  AppointmentListSkeleton,
  AppointmentsEmptyState,
  AppointmentsErrorState,
  AppointmentsGatedState,
  BookedForSomeoneElseChip,
  Pagination,
} from "@/components/features/shared/appointments";
import { useHcpAppointmentsQuery } from "@/hooks/use-hcp-appointments-query";
import { APPOINTMENTS_PAGE_SIZE, isForbidden } from "@/lib/api/appointments-contract";
import { getApiErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import type { Appointment, HcpAppointmentView } from "@/types/appointment";
import { HcpAppointmentActionDialog } from "./HcpAppointmentActionDialog";
import { HcpAppointmentDetailDialog } from "./HcpAppointmentDialogs";
import { HcpAppointmentCount, HcpAppointmentFilter } from "./HcpAppointmentFilter";
import { PatientIdentity } from "./PatientIdentity";

/** Shown while the API has not answered, so no tab renders `undefined`. */
const EMPTY_FACETS = {
  upcoming: 0,
  in_progress: 0,
  no_show: 0,
  history: 0,
};

/**
 * Per-stage empty copy. "No past visits" would be wrong for an empty In progress
 * tab, and the default two-view wording only knows about upcoming and past.
 */
const EMPTY_COPY: Record<HcpAppointmentView, { label: string; body: string }> = {
  upcoming: {
    label: "No upcoming visits",
    body: "As soon as a visit is booked with you it will appear here, with the patient, the date and the time.",
  },
  in_progress: {
    label: "Nobody is checked in",
    body: "Mark a patient as arrived and they will appear here, ready for you to close the visit.",
  },
  no_show: {
    label: "No missed visits",
    body: "Visits you mark as a no show are collected here.",
  },
  history: {
    label: "No closed visits yet",
    body: "Completed and cancelled visits are kept here.",
  },
};

/**
 * The clinician's schedule, read from `GET /hcp/appointments`.
 *
 * The same shape as the patient's screen - view filter, count, cards, pager - against
 * the same `AppointmentResource`, so the card, the status chip, the paging and the
 * empty/error states are all shared. Three things are this screen's own:
 *
 * - the subject of a card is the *attendee*, with the account holder named separately
 *   when they differ
 * - `Mark done` exists only here, because completing a visit is the clinician's act
 * - a 403 is a state to explain, not an error to retry: these routes sit behind the
 *   `hcp.verified` middleware, so an unverified account cannot ever load this list
 *
 * Splitting into upcoming/past is derived here rather than asked for - the backend
 * has no notion of "past", and a clinician's day view depends on exactly where "now"
 * falls.
 */
export function HcpAppointments() {
  const router = useRouter();
  const [view, setView] = useState<HcpAppointmentView>("upcoming");
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<Appointment | null>(null);

  const query = useHcpAppointmentsQuery(view, page);

  const grouped = useMemo(() => {
    const appointments = query.data?.appointments ?? [];

    // The stage is chosen by the API, so nothing is filtered out here - only sorted.
    // Past-facing stages read newest-first: the most recent visit is the one worth
    // seeing. Upcoming keeps chronological order because the next patient is what
    // matters.
    return [...appointments].sort((left, right) => {
      const delta =
        new Date(left.scheduled_start_at).getTime() - new Date(right.scheduled_start_at).getTime();
      return view === "upcoming" || view === "in_progress" ? delta : -delta;
    });
  }, [query.data?.appointments, view]);

  const isFirstLoad = query.isPending;

  return (
    <section
      id="appointments"
      aria-labelledby="appointments-heading"
      className="flex flex-col gap-5"
    >
      <div>
        <h1 id="appointments-heading" className="type-h1 text-foreground">
          Your schedule
        </h1>
        <p className="mt-2 type-body text-muted-foreground">
          The visits booked with you, who is attending, and what you can still change.
        </p>
      </div>

      <HcpAppointmentFilter
        value={view}
        counts={query.data?.facets ?? EMPTY_FACETS}
        onChange={(next) => {
          setView(next);
          // Page 4 of the previous stage means nothing against a different one.
          setPage(1);
        }}
      />

      {isFirstLoad ? (
        <AppointmentListSkeleton count={Math.min(APPOINTMENTS_PAGE_SIZE, 4)} />
      ) : isForbidden(query.error) ? (
        // The `hcp.verified` gate answers 403, not an empty list. Retrying would only
        // produce the same 403, so this points at the thing that actually unblocks it.
        <AppointmentsGatedState
          actionLabel="Check verification status"
          onAction={() => router.push(ROUTES.hcpVerification)}
        />
      ) : query.isError ? (
        <AppointmentsErrorState
          subject="your schedule"
          message={getApiErrorMessage(query.error, "Check your connection and try again.")}
          isRetrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : grouped.length === 0 ? (
        <AppointmentsEmptyState
          view={view === "upcoming" ? "upcoming" : "past"}
          noun="visits"
          emptyLabel={EMPTY_COPY[view].label}
          emptyBody={EMPTY_COPY[view].body}
        />
      ) : (
        <>
          <HcpAppointmentCount
            count={grouped.length}
            view={view}
            isUpdating={query.isFetching && !isFirstLoad}
          />

          <ul className="flex flex-col gap-3">
            {grouped.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  title={attendeeTitle(appointment)}
                  badges={
                    appointment.booking_for === "OTHER" ? <BookedForSomeoneElseChip /> : undefined
                  }
                  onView={() => setDetailId(appointment.id)}
                  onAction={() => setActionTarget(appointment)}
                >
                  <PatientIdentity appointment={appointment} />
                </AppointmentCard>
              </li>
            ))}
          </ul>

          <Pagination
            currentPage={query.data?.currentPage ?? page}
            totalPages={query.data?.totalPages ?? 1}
            onPageChange={setPage}
            disabled={query.isFetching}
          />
        </>
      )}

      <HcpAppointmentDetailDialog
        appointmentId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onAction={(appointment) => {
          setDetailId(null);
          setActionTarget(appointment);
        }}
      />

      <HcpAppointmentActionDialog
        appointment={actionTarget}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
      />
    </section>
  );
}

/**
 * The name on the card is the person who attends, not the account holder.
 *
 * For a visit booked on someone's behalf those differ, and a clinician preparing
 * for the visit needs the attendee's name; the account holder is stated on the card
 * body instead. Falls back to the account holder when the resource sends no
 * attendee, so the row is never untitled.
 */
function attendeeTitle(appointment: Appointment): string {
  const { attendee } = appointment;

  if (appointment.booking_for === "OTHER" && attendee) {
    const name = `${attendee.first_name} ${attendee.last_name}`.trim();
    if (name) return name;
  }

  return appointment.patient.name || "Patient";
}
