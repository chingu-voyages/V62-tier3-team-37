"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppointmentsQuery } from "@/hooks/use-appointments-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { APPOINTMENTS_PAGE_SIZE } from "@/lib/api/patient-appointments-client";
import { APPOINTMENT_VIEWS, type Appointment, type AppointmentView } from "@/types/appointment";

import { HCPPagination } from "../HCPDirectory/HCPPagination";
import {
  AppointmentDetailDialog,
  CancelAppointmentDialog,
  RescheduleDialog,
} from "./AppointmentDialogs";
import {
  AppointmentCard,
  AppointmentListSkeleton,
  AppointmentsEmptyState,
  AppointmentsErrorState,
  appointmentView,
} from "./appointment-parts";

/**
 * "Your appointments", read from `GET /patient/appointments`.
 *
 * The list is the API's: it decides ownership and ordering, and this component never
 * keeps its own copy. Splitting it into upcoming/past is a view concern - the
 * backend has no notion of "past" - so it is derived here from the start time and the
 * status rather than stored.
 *
 * Three request states are handled distinctly, because they mean different things to
 * someone looking for their next visit:
 *
 * - pending  -> `AppointmentListSkeleton`, shaped like the real rows
 * - error    -> `AppointmentsErrorState`, with a retry, because the appointments
 *               still exist and something failed
 * - empty    -> `AppointmentsEmptyState`, an invitation rather than a fault
 *
 * A *page* fetch in flight keeps the current rows visible (`keepPreviousData` in the
 * query), so only the first load shows a skeleton.
 */
export function PatientAppointments() {
  const router = useRouter();
  const [view, setView] = useState<AppointmentView>("upcoming");
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const query = useAppointmentsQuery(page);

  const grouped = useMemo(() => {
    const appointments = query.data?.appointments ?? [];

    // `now` is fixed for the lifetime of one render pass so a list cannot be split
    // down the middle by a clock tick between two rows.
    const now = new Date();
    const match = (appointment: Appointment) => appointmentView(appointment, now) === view;

    return appointments.filter(match).sort((left, right) => {
      const delta =
        new Date(left.scheduled_start_at).getTime() - new Date(right.scheduled_start_at).getTime();
      return view === "past" ? -delta : delta;
    });
  }, [query.data?.appointments, view]);

  const isFirstLoad = query.isPending;

  function browseDoctors() {
    router.push("/patient/search");
  }

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
            Review upcoming visits, see the details, or cancel a booking.
          </p>
        </div>
        <Button type="button" onClick={browseDoctors}>
          <CalendarPlus />
          Book a visit
        </Button>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="sr-only">Filter appointments</legend>
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_VIEWS.map((item) => {
            const selected = view === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => {
                  setView(item.value);
                  // Page 4 of the previous view means nothing against a different one.
                  setPage(1);
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {isFirstLoad ? (
        <AppointmentListSkeleton count={Math.min(APPOINTMENTS_PAGE_SIZE, 4)} />
      ) : query.isError ? (
        <AppointmentsErrorState
          message={getApiErrorMessage(query.error, "Check your connection and try again.")}
          isRetrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : grouped.length === 0 ? (
        <AppointmentsEmptyState view={view} onBrowseDoctors={browseDoctors} />
      ) : (
        <>
          <p className="type-label font-medium text-primary" aria-live="polite">
            {grouped.length} {view === "upcoming" ? "upcoming" : "past"} appointment
            {grouped.length === 1 ? "" : "s"}
            {query.isFetching && !isFirstLoad ? <span className="sr-only">, updating</span> : null}
          </p>

          {/*
            Paging is the API's, not ours: `index` returns 15 rows and the split into
            upcoming/past is applied within the page that was fetched. A patient's
            upcoming visits can therefore be spread across pages, so the count below
            describes the page rather than the whole history.
          */}
          <ul className="flex flex-col gap-3">
            {grouped.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  onView={() => setDetailId(appointment.id)}
                  onReschedule={() => setRescheduleTarget(appointment)}
                  onCancel={() => setCancelTarget(appointment)}
                />
              </li>
            ))}
          </ul>

          <HCPPagination
            currentPage={query.data?.currentPage ?? page}
            totalPages={query.data?.totalPages ?? 1}
            onPageChange={setPage}
            disabled={query.isFetching}
          />
        </>
      )}

      <AppointmentDetailDialog
        appointmentId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onCancel={(appointment) => {
          setDetailId(null);
          setCancelTarget(appointment);
        }}
      />

      <CancelAppointmentDialog
        appointment={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      />

      <RescheduleDialog
        appointment={rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null);
        }}
      />
    </section>
  );
}
