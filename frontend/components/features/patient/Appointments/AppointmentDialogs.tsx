"use client";

import { CalendarClock, Clock, Loader2, Stethoscope, UserRound, XCircle } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  appointmentDate,
  appointmentStatusLabel,
  appointmentTime,
  attendeeName,
  canManageAppointment,
} from "@/components/features/shared/appointments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton, skeletonKeys } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useHcpAvailabilityQuery } from "@/hooks/use-hcps-query";
import {
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
} from "@/hooks/use-patient-appointment-mutations";
import { usePatientAppointmentQuery } from "@/hooks/use-patient-appointments-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { startOfDay, toIsoDate } from "@/lib/booking/schedule";
import { slotToIsoTimestamp } from "@/lib/booking/slots";
import { formatClockTime, formatLongDate } from "@/lib/format";
import type { Appointment } from "@/types/appointment";
import { AVAILABILITY_RANGE_MAX_DAYS } from "@/types/appointment";

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

type DetailDialogProps = {
  /** `null` closes the dialog; a number fetches that appointment. */
  appointmentId: number | null;
  onOpenChange: (open: boolean) => void;
  onCancel: (appointment: Appointment) => void;
};

/**
 * Appointment detail, read through `GET /patient/appointments/{appointment}`.
 *
 * The list is paginated, so the record being opened may not be cached at all; it is
 * re-fetched with the patient's ownership constraint applied by the backend. While
 * that is in flight a skeleton stands in for the body rather than the previous
 * appointment's, which would show the wrong clinician and time.
 */
export function AppointmentDetailDialog({
  appointmentId,
  onOpenChange,
  onCancel,
}: DetailDialogProps) {
  const query = usePatientAppointmentQuery(appointmentId);
  const appointment = query.data;

  return (
    <Dialog
      open={appointmentId !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {query.isPending ? (
          <DetailSkeleton />
        ) : query.isError ? (
          <DetailError
            message={getApiErrorMessage(query.error, "We couldn't load this appointment.")}
            isRetrying={query.isFetching}
            onRetry={() => void query.refetch()}
          />
        ) : appointment ? (
          <DetailBody
            appointment={appointment}
            onCancel={() => onCancel(appointment)}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  appointment,
  onCancel,
  onClose,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onClose: () => void;
}) {
  const manageable = canManageAppointment(appointment);

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>{appointment.hcp.name}</DialogTitle>
        <DialogDescription>{appointmentStatusLabel(appointment)}</DialogDescription>
      </DialogHeader>

      <dl className="grid gap-3">
        {appointment.hcp.specialty && (
          <Detail icon={Stethoscope} label="Specialty" value={appointment.hcp.specialty} />
        )}
        <Detail
          icon={CalendarClock}
          label="When"
          value={`${appointmentDate(appointment)} at ${appointmentTime(appointment)}`}
        />
        <Detail icon={UserRound} label="Booked for" value={attendeeLabel(appointment)} />
        {appointment.notes && <Detail icon={Clock} label="Notes" value={appointment.notes} />}
        {appointment.cancellation_reason && (
          <Detail icon={XCircle} label="Reason" value={appointment.cancellation_reason} />
        )}
      </dl>

      <DialogFooter>
        {manageable && (
          <Button type="button" variant="destructive" onClick={onCancel}>
            Cancel visit
          </Button>
        )}
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-2 flex justify-end gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

function DetailError({
  message,
  isRetrying,
  onRetry,
}: {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="grid gap-4">
      <DialogHeader className="items-start">
        <DialogTitle>Couldn&apos;t load this appointment</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                      */
/* -------------------------------------------------------------------------- */

type CancelDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirm a cancellation, optionally with a reason.
 *
 * `reason` is optional on the wire, so the button is not gated on it. The backend
 * refuses a cancellation once the visit has started; that surfaces here as an inline
 * error rather than as a silent no-op.
 */
export function CancelAppointmentDialog({ appointment, onOpenChange }: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const mutation = useCancelAppointmentMutation();
  const reasonId = useId();

  function reset() {
    setReason("");
    mutation.reset();
  }

  return (
    <Dialog
      open={appointment !== null}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {appointment && (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Cancel this visit?</DialogTitle>
              <DialogDescription>
                {appointment.hcp.name} on {appointmentDate(appointment)} will be marked as
                cancelled. The slot is released for other patients.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label htmlFor={reasonId} className="type-label text-muted-foreground">
                Reason <span className="font-normal">(optional)</span>
              </label>
              <Textarea
                id={reasonId}
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Let the clinic know why, if you'd like."
              />
            </div>

            {mutation.isError && (
              <p role="alert" className="type-helper text-destructive">
                {getApiErrorMessage(mutation.error, "We couldn't cancel this visit.")}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Keep appointment
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutation.isPending}
                onClick={() => {
                  const trimmed = reason.trim();
                  mutation.mutate(
                    { id: appointment.id, reason: trimmed.length > 0 ? trimmed : null },
                    {
                      onSuccess: () => {
                        toast.success("Appointment cancelled.");
                        reset();
                        onOpenChange(false);
                      },
                    },
                  );
                }}
              >
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {mutation.isPending ? "Cancelling…" : "Cancel visit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Reschedule                                                                  */
/* -------------------------------------------------------------------------- */

type RescheduleDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Move a visit to a genuinely free slot.
 *
 * The slot list is read from `GET /patient/hcps/{hcp}/availability`, so what is
 * offered is what the clinician actually has free - including slots the backend will
 * not accept because they collide with an existing appointment. Picking from here
 * rather than typing a time means the 409 path is a race, not the normal case.
 *
 * The new start is built by `slotToIsoTimestamp`, which appends the offset the
 * backend used to generate the slot. Sending a bare `HH:mm` would be rejected.
 */
export function RescheduleDialog({ appointment, onOpenChange }: RescheduleDialogProps) {
  const [picked, setPicked] = useState<{ date: string; slot: string } | null>(null);
  const mutation = useRescheduleAppointmentMutation();

  // The full 31-day window the endpoint allows, counted from today. Anything the
  // clinician has free inside it is offered; the picker skips empty days.
  const today = startOfDay(new Date());
  const from = toIsoDate(today);
  const to = toIsoDate(new Date(today.getTime() + (AVAILABILITY_RANGE_MAX_DAYS - 1) * 86_400_000));

  const hcpId = appointment ? Number(appointment.hcp.id) : null;
  const availability = useHcpAvailabilityQuery(
    hcpId !== null && Number.isFinite(hcpId) ? hcpId : null,
    from,
    to,
  );

  // Availability is scoped to the clinician on the appointment, so a pick can only
  // ever be one of their real free slots. The same 409 the booking flow handles can
  // still happen - someone else books it between this read and the submit.

  function reset() {
    setPicked(null);
    mutation.reset();
  }

  return (
    <Dialog
      open={appointment !== null}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {appointment && (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Postpone this visit</DialogTitle>
              <DialogDescription>
                {appointment.hcp.name} is currently booked for {appointmentDate(appointment)} at{" "}
                {appointmentTime(appointment)}. Pick a new free slot.
              </DialogDescription>
            </DialogHeader>

            {availability.isPending ? (
              <div className="grid gap-2">
                {skeletonKeys(3).map((key) => (
                  <Skeleton key={key} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : availability.isError ? (
              <p role="alert" className="type-helper text-destructive">
                {getApiErrorMessage(
                  availability.error,
                  "We couldn't load this clinician's free slots.",
                )}
              </p>
            ) : (
              <FreeSlotPicker
                dates={availability.data?.dates ?? []}
                selected={picked}
                onSelect={setPicked}
              />
            )}

            {mutation.isError && (
              <p role="alert" className="type-helper text-destructive">
                {getApiErrorMessage(mutation.error, "We couldn't move this visit.")}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Keep current time
              </Button>
              <Button
                type="button"
                disabled={mutation.isPending || picked === null}
                onClick={() => {
                  if (!picked) return;
                  // The offset has to be explicit; the backend rejects a bare time.
                  const scheduledStartAt = slotToIsoTimestamp(picked.date, picked.slot);
                  if (!scheduledStartAt) return;

                  mutation.mutate(
                    { id: appointment.id, scheduled_start_at: scheduledStartAt },
                    {
                      onSuccess: () => {
                        toast.success("Appointment moved.");
                        reset();
                        onOpenChange(false);
                      },
                    },
                  );
                }}
              >
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {mutation.isPending ? "Moving…" : "Move to this slot"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type FreeSlotPickerProps = {
  dates: { date: string; slots: string[] }[];
  selected: { date: string; slot: string } | null;
  onSelect: (pick: { date: string; slot: string }) => void;
};

/**
 * Free slots grouped by day.
 *
 * Days with nothing free are skipped entirely rather than shown as an empty row, so
 * the list only ever contains something selectable.
 */
function FreeSlotPicker({ dates, selected, onSelect }: FreeSlotPickerProps) {
  const bookable = dates.filter((entry) => entry.slots.length > 0);

  if (bookable.length === 0) {
    return (
      <p className="type-body text-muted-foreground">
        This clinician has no free slots in the next month. Try again later.
      </p>
    );
  }

  return (
    <div className="grid max-h-72 gap-4 overflow-y-auto pr-1">
      {bookable.map((entry) => (
        <fieldset key={entry.date} className="border-0 p-0">
          <legend className="type-label text-muted-foreground">{formatLongDate(entry.date)}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.slots.map((slot) => {
              const isSelected = selected?.date === entry.date && selected.slot === slot;
              return (
                <Button
                  key={`${entry.date}-${slot}`}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  aria-pressed={isSelected}
                  onClick={() => onSelect({ date: entry.date, slot })}
                >
                  {formatClockTime(slot)}
                </Button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Who the visit is for, from this patient's point of view.
 *
 * `attendeeName` resolves the SELF/OTHER branch; the "(you)" suffix is added here
 * because only this screen has that relationship to the attendee - a clinician
 * looking at the same record has no such claim.
 */
function attendeeLabel(appointment: Appointment): string {
  return appointment.booking_for === "SELF"
    ? `${attendeeName(appointment)} (you)`
    : attendeeName(appointment);
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <dt className="type-helper text-muted-foreground">{label}</dt>
        <dd className="type-body text-foreground">{value}</dd>
      </div>
    </div>
  );
}
