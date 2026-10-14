"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentUploadCard } from "@/components/features/hcp/DocumentUploadCard";
import { MonthCalendar } from "@/components/features/Patient/Booking/MonthCalendar";
import { useAvailabilityRange } from "@/components/features/Patient/Booking/useAvailabilityRange";
import {
  appointmentDate,
  appointmentTime,
  canManageAppointment,
  canSummariseAppointment,
} from "@/components/features/shared/appointments";
import { TimeSlots } from "@/components/features/shared/booking/TimeSlots";
import { SelectField } from "@/components/features/shared/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { useHcpAppointmentActionMutation } from "@/hooks/use-hcp-appointment-mutations";
import { useOwnAvailabilityQuery } from "@/hooks/use-hcps-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { startOfDay } from "@/lib/booking/schedule";
import { slotToIsoTimestamp } from "@/lib/booking/slots";
import type { Appointment, AppointmentStatus, HcpAvailabilitySlot } from "@/types/appointment";

/**
 * One dialog for every change a clinician can make to a visit.
 *
 * The status is the decision and the rest is the paperwork that decision needs, so
 * the two are one form rather than four dialogs: pick "Cancel" and the reason field
 * appears, pick "Reschedule" and the free-slot picker does. Splitting them meant the
 * clinician had to already know which action they wanted before the UI would let
 * them start it.
 */
type ActionDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
};

/** Statuses offered from a visit that is still in the clinician's hands. */
const TARGETS: { value: AppointmentStatus; label: string }[] = [
  { value: "ARRIVED", label: "Patient arrived" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No show" },
  { value: "RESCHEDULED", label: "Reschedule" },
  { value: "CANCELLED", label: "Cancel" },
];

/**
 * Outer shell: owns the dialog's open state and hands the form a `key`.
 *
 * Remounting on the appointment id is what clears the form between visits. The
 * alternative - clearing it from an effect - runs a render cascade on every open,
 * and an effect that depends on the appointment also re-fires whenever the list
 * refetches, wiping a half-filled form mid-entry.
 */
export function HcpAppointmentActionDialog({ appointment, onOpenChange }: ActionDialogProps) {
  return (
    <Dialog open={appointment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {appointment ? (
          <HcpAppointmentActionForm
            key={appointment.id}
            appointment={appointment}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** The form itself. Remounting this is what resets every field. */
function HcpAppointmentActionForm({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}) {
  const mutation = useHcpAppointmentActionMutation();

  const [target, setTarget] = useState<AppointmentStatus | "">("");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  // Reschedule is two decisions: the calendar date, then a wall-clock time. The API
  // reports availability per date, and only the pair resolves to an instant - so the
  // time list is meaningless until a day is chosen.
  const [month, setMonth] = useState(() => startOfDay(new Date()));
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  // Availability is only fetched for the one choice that needs it, so opening the
  // dialog for a cancellation does not pay for a month of the diary.
  const needsSlot = target === "RESCHEDULED";

  const range = useAvailabilityRange(month);
  const availability = useOwnAvailabilityQuery(
    range.from,
    range.to,
    // The slot the visit currently occupies has to read as free, or the one time
    // the clinician would most plausibly move it to is missing from the list.
    appointment.id,
    needsSlot,
  );

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, HcpAvailabilitySlot[]>();
    for (const entry of availability.data?.dates ?? []) {
      map.set(entry.date, entry.slots);
    }
    return map;
  }, [availability.data?.dates]);

  const daySlots = date ? (availabilityByDate.get(date) ?? []) : [];

  // Built through `slotToIsoTimestamp` rather than by hand: the availability API
  // returns a bare `HH:mm` with no offset, so combining it with the date in the
  // browser's own zone would silently move every booking by the local offset.
  const startAt = date && time ? slotToIsoTimestamp(date, time) : null;

  const trimmedReason = reason.trim();
  const trimmedSummary = summary.trim();

  // Only what this particular choice requires blocks Apply, so the button stays
  // honest instead of being disabled with no visible reason.
  const missing =
    target === ""
      ? "Choose what happened."
      : target === "CANCELLED" && trimmedReason === ""
        ? "Give a reason so the patient understands."
        : target === "RESCHEDULED" && !startAt
          ? "Pick the new slot."
          : target === "COMPLETED" && trimmedSummary === ""
            ? "Add a short summary for the record."
            : null;

  function apply() {
    if (!target || missing) return;

    mutation.mutate(
      {
        id: appointment.id,
        target,
        currentStatus: appointment.status,
        reason: trimmedReason,
        summary: trimmedSummary,
        document,
        slot: startAt ? { startAt } : undefined,
      },
      {
        onSuccess: ({ documentUploaded }) => {
          toast.success(
            documentUploaded ? "Visit closed and the result was saved." : "Visit updated.",
          );
          onDone();
        },
      },
    );
  }

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>Update this visit</DialogTitle>
        <DialogDescription>
          {appointmentDate(appointment)} at {appointmentTime(appointment)}. Choose what happened,
          then fill in what that choice needs.
        </DialogDescription>
      </DialogHeader>

      {!canManageAppointment(appointment) && !canSummariseAppointment(appointment) ? (
        <>
          <p className="type-body text-muted-foreground">
            This visit is no longer yours to change. Its history is kept below.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone}>
              Close
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <SelectField
            id="appointment-action"
            label="What happened"
            placeholder="Choose an action"
            value={target}
            onChange={(value) => {
              setTarget(value as AppointmentStatus | "");
              // Clear the parts of the form the new choice does not use, so
              // switching away and back never leaves stale text behind.
              if (value !== "CANCELLED") setReason("");
              if (value !== "COMPLETED") {
                setSummary("");
                setDocument(null);
              }
              if (value !== "RESCHEDULED") {
                setDate(null);
                setTime(null);
              }
            }}
            options={TARGETS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />

          {target === "CANCELLED" ? (
            <TextField
              id="appointment-cancel-reason"
              label="Reason"
              value={reason}
              onChange={setReason}
              maxLength={120}
              required
              placeholder="Why is this visit being cancelled?"
            />
          ) : null}

          {target === "RESCHEDULED" ? (
            availability.isError ? (
              <p role="alert" className="type-helper text-destructive">
                {getApiErrorMessage(availability.error, "We couldn't load your free slots.")}
              </p>
            ) : (
              <>
                <MonthCalendar
                  month={month}
                  today={startOfDay(new Date())}
                  selected={date}
                  availability={availabilityByDate}
                  isLoading={availability.isPending}
                  onMonthChange={setMonth}
                  onSelect={(isoDate) => {
                    setDate(isoDate);
                    // A time from the previously chosen day means nothing here.
                    setTime(null);
                  }}
                />

                <div className="mt-4 border-t border-border pt-4">
                  {!date ? (
                    <p className="rounded-lg border border-dashed border-primary/30 bg-accent px-3 py-3 type-label text-pretty text-muted-foreground">
                      Choose an open day. Times appear underneath.
                    </p>
                  ) : daySlots.length === 0 ? (
                    <p className="type-body text-muted-foreground">
                      No free slots left on that day. Pick another.
                    </p>
                  ) : (
                    <TimeSlots slots={daySlots} selected={time} onSelect={setTime} />
                  )}
                </div>
              </>
            )
          ) : null}

          {target === "NO_SHOW" ? (
            <p className="type-body text-muted-foreground">
              Nothing else is needed. The visit will be recorded as a missed appointment.
            </p>
          ) : null}

          {target === "ARRIVED" ? (
            <p className="type-body text-muted-foreground">
              The patient is checked in. You can then close the visit with a summary.
            </p>
          ) : null}

          {target === "COMPLETED" ? (
            <>
              <TextField
                id="appointment-summary"
                label="Summary"
                value={summary}
                onChange={setSummary}
                required
                placeholder="What happened during the visit?"
              />

              <DocumentUploadCard
                id="appointment-result"
                title="Attach a result (optional)"
                description="A PDF or image the patient can open from their records."
                file={document}
                onFileChange={setDocument}
              />
            </>
          ) : null}

          {mutation.isError ? (
            <p role="alert" className="type-helper text-destructive">
              {getApiErrorMessage(mutation.error, "We couldn't update this visit.")}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onDone}>
              Cancel
            </Button>
            <Button type="button" disabled={mutation.isPending || Boolean(missing)} onClick={apply}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mutation.isPending ? "Applyingâ€¦" : "Apply"}
            </Button>
          </DialogFooter>

          {missing ? <p className="type-helper text-muted-foreground">{missing}</p> : null}
        </>
      )}
    </>
  );
}
