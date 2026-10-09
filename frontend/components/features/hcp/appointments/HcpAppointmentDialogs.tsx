"use client";

import {
  CalendarClock,
  CheckCircle2,
  type Clock,
  Loader2,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  appointmentDate,
  appointmentStatusLabel,
  appointmentTime,
  canCompleteAppointment,
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
import {
  useCancelHcpAppointmentMutation,
  useCompleteHcpAppointmentMutation,
  useRescheduleHcpAppointmentMutation,
} from "@/hooks/use-hcp-appointment-mutations";
import { useHcpAppointmentQuery } from "@/hooks/use-hcp-appointments-query";
import { useHcpAvailabilityQuery } from "@/hooks/use-hcps-query";
import { isSlotConflict } from "@/lib/api/appointments-contract";
import { getApiErrorMessage } from "@/lib/api/client";
import { startOfDay, toIsoDate } from "@/lib/booking/schedule";
import { slotToIsoTimestamp } from "@/lib/booking/slots";
import { formatClockTime, formatLongDate } from "@/lib/format";
import type { Appointment } from "@/types/appointment";
import { AVAILABILITY_RANGE_MAX_DAYS } from "@/types/appointment";

import { PatientIdentity } from "./PatientIdentity";

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

type DetailDialogProps = {
  /** `null` closes the dialog; a number fetches that appointment. */
  appointmentId: number | null;
  onOpenChange: (open: boolean) => void;
  onCancel: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
};

/**
 * Appointment detail, read through `GET /hcp/appointments/{appointment}`.
 *
 * The list is paginated, so the record being opened may not be cached at all; it is
 * re-fetched with the clinician's ownership constraint applied by the backend. While
 * that is in flight a skeleton stands in for the body rather than the previous
 * patient's, which would show the wrong identity and time.
 */
export function HcpAppointmentDetailDialog({
  appointmentId,
  onOpenChange,
  onCancel,
  onComplete,
}: DetailDialogProps) {
  const query = useHcpAppointmentQuery(appointmentId);
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
            onComplete={() => onComplete(appointment)}
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
  onComplete,
  onClose,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const manageable = canManageAppointment(appointment);
  const completable = canCompleteAppointment(appointment);

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>Visit details</DialogTitle>
        <DialogDescription>
          {appointmentStatusLabel(appointment)} · {appointmentDate(appointment)} at{" "}
          {appointmentTime(appointment)}
        </DialogDescription>
      </DialogHeader>

      <PatientIdentity appointment={appointment} />

      <dl className="grid gap-3">
        <Detail
          icon={CalendarClock}
          label="When"
          value={`${appointmentDate(appointment)} at ${appointmentTime(appointment)}`}
        />
        {appointment.hcp.specialty ? (
          <Detail icon={Stethoscope} label="Specialty" value={appointment.hcp.specialty} />
        ) : null}
        {appointment.cancellation_reason ? (
          <Detail icon={XCircle} label="Reason" value={appointment.cancellation_reason} />
        ) : null}
      </dl>

      <DialogFooter>
        {manageable ? (
          <Button type="button" variant="destructive" onClick={onCancel}>
            Cancel visit
          </Button>
        ) : null}
        {completable ? (
          <Button type="button" variant="secondary" onClick={onComplete}>
            <CheckCircle2 className="mr-1.5 size-4" aria-hidden="true" />
            Mark as done
          </Button>
        ) : null}
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
export function CancelHcpAppointmentDialog({ appointment, onOpenChange }: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const mutation = useCancelHcpAppointmentMutation();
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
                {appointmentDate(appointment)} will be marked as cancelled and the slot released for
                another patient.
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
                placeholder="Let the patient know why, if you'd like."
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
 * Move a visit to a genuinely free slot in the clinician's own diary.
 *
 * The slot list comes from the same availability endpoint the booking flow reads,
 * which is scoped to the clinician on the appointment - so a pick can only ever be
 * one of their real free slots. The backend still refuses a slot that collides with
 * the patient's other visits, so the 409 path is a race rather than the normal case.
 *
 * The new start is built by `slotToIsoTimestamp`, which appends the offset the
 * backend used to generate the slot; a bare `HH:mm` would be rejected.
 */
export function RescheduleHcpAppointmentDialog({
  appointment,
  onOpenChange,
}: RescheduleDialogProps) {
  const [picked, setPicked] = useState<{ date: string; slot: string } | null>(null);
  const mutation = useRescheduleHcpAppointmentMutation();

  // The full window the endpoint allows, counted from today. An empty diary offers
  // nothing rather than an empty list of days.
  const today = startOfDay(new Date());
  const from = toIsoDate(today);
  const to = toIsoDate(new Date(today.getTime() + (AVAILABILITY_RANGE_MAX_DAYS - 1) * 86_400_000));

  const hcpId = appointment ? Number(appointment.hcp.id) : null;
  const availability = useHcpAvailabilityQuery(
    hcpId !== null && Number.isFinite(hcpId) ? hcpId : null,
    from,
    to,
  );

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
              <DialogTitle>Move this visit</DialogTitle>
              <DialogDescription>
                Currently booked for {appointmentDate(appointment)} at{" "}
                {appointmentTime(appointment)}. Pick another free slot from your diary.
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
                {getApiErrorMessage(availability.error, "We couldn't load your free slots.")}
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
                {getApiErrorMessage(
                  mutation.error,
                  isSlotConflict(mutation.error)
                    ? "That slot is no longer free."
                    : "We couldn't move this visit.",
                )}
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
        You have no free slots in the next month. Publish more availability from your profile to
        open your diary.
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
/* Complete                                                                    */
/* -------------------------------------------------------------------------- */

type CompleteDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirm a visit happened.
 *
 * A confirmation rather than a single click, because it is irreversible from the
 * clinician's side: the backend will not move a COMPLETED appointment back, and the
 * button is only offered once the visit has ended.
 */
export function CompleteHcpAppointmentDialog({ appointment, onOpenChange }: CompleteDialogProps) {
  const mutation = useCompleteHcpAppointmentMutation();

  return (
    <Dialog
      open={appointment !== null}
      onOpenChange={(open) => {
        if (!open) {
          mutation.reset();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {appointment && (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Mark this visit as done?</DialogTitle>
              <DialogDescription>
                The visit on {appointmentDate(appointment)} will be recorded as completed. This
                cannot be undone from here.
              </DialogDescription>
            </DialogHeader>

            {mutation.isError && (
              <p role="alert" className="type-helper text-destructive">
                {getApiErrorMessage(mutation.error, "We couldn't complete this visit.")}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  mutation.reset();
                  onOpenChange(false);
                }}
              >
                Not yet
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={() => {
                  mutation.mutate(
                    { id: appointment.id },
                    {
                      onSuccess: () => {
                        toast.success("Visit marked as completed.");
                        mutation.reset();
                        onOpenChange(false);
                      },
                    },
                  );
                }}
              >
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {mutation.isPending ? "Saving…" : "Mark as done"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
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
