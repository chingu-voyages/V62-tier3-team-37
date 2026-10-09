"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AppointmentCard,
  AppointmentCount,
  AppointmentListSkeleton,
  AppointmentsEmptyState,
  AppointmentsErrorState,
  AppointmentsGatedState,
  AppointmentViewFilter,
  appointmentView,
  BookedForSomeoneElseChip,
  Pagination,
} from "@/components/features/shared/appointments";
import { useHcpAppointmentsQuery } from "@/hooks/use-hcp-appointments-query";
import { APPOINTMENTS_PAGE_SIZE, isForbidden } from "@/lib/api/appointments-contract";
import { getApiErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import type { Appointment, AppointmentView } from "@/types/appointment";

import {
  CancelHcpAppointmentDialog,
  CompleteHcpAppointmentDialog,
  HcpAppointmentDetailDialog,
  RescheduleHcpAppointmentDialog,
} from "./HcpAppointmentDialogs";
import { PatientIdentity } from "./PatientIdentity";

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
  const [view, setView] = useState<AppointmentView>("upcoming");
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);

  const query = useHcpAppointmentsQuery(page);

  const grouped = useMemo(() => {
    const appointments = query.data?.appointments ?? [];

    // One `now` for the whole pass, so a clock tick between two rows cannot split the
    // list down the middle.
    const now = new Date();

    return appointments
      .filter((appointment) => appointmentView(appointment, now) === view)
      .sort((left, right) => {
        const delta =
          new Date(left.scheduled_start_at).getTime() -
          new Date(right.scheduled_start_at).getTime();
        // Past reads newest-first: the most recent visit is the one worth seeing.
        return view === "past" ? -delta : delta;
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

      <AppointmentViewFilter
        value={view}
        onChange={(next) => {
          setView(next);
          // Page 4 of the previous view means nothing against a different one.
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
        <AppointmentsEmptyState view={view} noun="visits" />
      ) : (
        <>
          <AppointmentCount
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
                  onReschedule={() => setRescheduleTarget(appointment)}
                  onCancel={() => setCancelTarget(appointment)}
                  onComplete={() => setCompleteTarget(appointment)}
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
        onCancel={(appointment) => {
          setDetailId(null);
          setCancelTarget(appointment);
        }}
        onComplete={(appointment) => {
          setDetailId(null);
          setCompleteTarget(appointment);
        }}
      />

      <CancelHcpAppointmentDialog
        appointment={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      />

      <RescheduleHcpAppointmentDialog
        appointment={rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null);
        }}
      />

      <CompleteHcpAppointmentDialog
        appointment={completeTarget}
        onOpenChange={(open) => {
          if (!open) setCompleteTarget(null);
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
