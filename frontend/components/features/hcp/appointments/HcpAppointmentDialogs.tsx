"use client";

import { CalendarClock, CheckCircle2, type Clock, Stethoscope, XCircle } from "lucide-react";
import {
  appointmentDate,
  appointmentStatusLabel,
  appointmentTime,
  canManageAppointment,
  canSummariseAppointment,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useHcpAppointmentQuery } from "@/hooks/use-hcp-appointments-query";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Appointment } from "@/types/appointment";

import { PatientIdentity } from "./PatientIdentity";

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

type DetailDialogProps = {
  /** `null` closes the dialog; a number fetches that appointment. */
  appointmentId: number | null;
  onOpenChange: (open: boolean) => void;
  /** Hands the visit to the unified action dialog. */
  onAction: (appointment: Appointment) => void;
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
  onAction,
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
            onAction={() => onAction(appointment)}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  appointment,
  onAction,
  onClose,
}: {
  appointment: Appointment;
  onAction: () => void;
  onClose: () => void;
}) {
  const manageable = canManageAppointment(appointment);
  const summarisable = canSummariseAppointment(appointment);

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>Visit details</DialogTitle>
        <DialogDescription>
          {appointmentStatusLabel(appointment)} Â· {appointmentDate(appointment)} at{" "}
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
        {/* One button: the outcome is chosen in the action dialog, which also
            collects whatever that outcome needs. Offering Cancel and Mark as done
            separately meant the clinician had to decide before opening anything. */}
        {manageable || summarisable ? (
          <Button type="button" variant="secondary" onClick={onAction}>
            <CheckCircle2 className="mr-1.5 size-4" aria-hidden="true" />
            Update visit
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
          {isRetrying ? "Retryingâ€¦" : "Try again"}
        </Button>
      </DialogFooter>
    </div>
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
