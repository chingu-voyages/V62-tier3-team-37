"use client";

import { CalendarCheck, Check, Loader2, X } from "lucide-react";
import { type FC, type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { skeletonKeys } from "@/components/ui/skeleton";
import { useCreateAppointmentMutation } from "@/hooks/use-create-appointment-mutation";
import { useHcpAvailabilityQuery } from "@/hooks/use-hcps-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { isSlotConflict } from "@/lib/api/patient-appointments-client";
import { formatClockTime, formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HcpAvailabilitySlot } from "@/types/appointment";
import type { HCP } from "@/types/hcp-directory";

import { BookingConfirmation } from "./BookingConfirmation";
import { BookingForToggle } from "./BookingForToggle";
import { BookingNotes } from "./BookingNotes";
import type { BookingPatient, BookingRequest } from "./booking-types";
import { DoctorSummary } from "./DoctorSummary";
import { GuestDetailsForm } from "./GuestDetailsForm";
import { MonthCalendar } from "./MonthCalendar";
import { PatientIdentityCard } from "./PatientIdentityCard";
import { useAvailabilityRange } from "./useAvailabilityRange";
import { bookingSummary, buildAppointmentRequest, useBookingDraft } from "./useBookingDraft";

type OnRequest = (doctor: HCP, request: BookingRequest) => void;

type PatientBookingPanelProps = {
  doctor: HCP | null;
  patient: BookingPatient;
  onClose: () => void;
  onRequest?: OnRequest;
};

/**
 * Booking slide-over for one HCP (task < 10s, 2+ fields -> slide-over, 448px).
 *
 * Colour budget: mint canvas (60) / white panels (30) / HealthHub green (10).
 * Green is spent only on: header band, step markers, selected state, confirm.
 * The form is keyed by doctor id, so switching doctors discards the draft.
 */
export const PatientBookingPanel: FC<PatientBookingPanelProps> = ({
  doctor,
  patient,
  onClose,
  onRequest,
}) => {
  return (
    <Dialog
      open={doctor !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="top-0 right-0 bottom-0 px-2 left-auto flex h-dvh max-h-dvh w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-accent p-0 ring-0 sm:max-w-md sm:rounded-l-3xl sm:shadow-panel data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
        {doctor ? (
          <BookingForm
            key={doctor.id}
            doctor={doctor}
            patient={patient}
            onClose={onClose}
            onRequest={onRequest}
          />
        ) : (
          <DialogTitle className="sr-only">Book appointment</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* Logic                                                                       */
/* -------------------------------------------------------------------------- */

const joinName = (first: string, last: string): string => {
  return [first, last]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
};

const isGuestReady = (guest: { firstName: string; lastName: string }): boolean => {
  return guest.firstName.trim() !== "" && guest.lastName.trim() !== "";
};

type UseBookingFormArgs = {
  doctor: HCP;
  patient: BookingPatient;
  onRequest?: OnRequest;
};

/** Wraps the draft hook with everything the view derives from it. */
const useBookingForm = ({ doctor, patient, onRequest }: UseBookingFormArgs) => {
  const booking = useBookingDraft();
  const { draft } = booking;
  const createAppointment = useCreateAppointmentMutation();

  const hcpId = Number(doctor.id);
  const range = useAvailabilityRange(booking.month);
  const availability = useHcpAvailabilityQuery(
    Number.isFinite(hcpId) ? hcpId : null,
    range.from,
    range.to,
  );

  // Availability is a map so the calendar and the slot list read the same data,
  // and so a day with an empty `slots` array is visibly unavailable rather than
  // missing.
  const availabilityByDate = useMemo(() => {
    const map = new Map<string, HcpAvailabilitySlot[]>();
    for (const day of availability.data?.dates ?? []) {
      map.set(day.date, day.slots);
    }
    return map;
  }, [availability.data]);

  const location = [doctor.area, doctor.city].filter(Boolean).join(", ");
  const patientName = joinName(patient.firstName, patient.lastName);
  const guestName = joinName(draft.guest.firstName, draft.guest.lastName);

  const selectedSlots = draft.date ? availabilityByDate.get(draft.date) : undefined;
  const selectedTime = draft.time;

  // The label comes from the availability response, so it is the API's own rendering
  // of that slot rather than a locally invented time.
  const slotLabel =
    selectedTime && selectedSlots?.includes(selectedTime)
      ? formatClockTime(selectedTime)
      : undefined;

  const summary = bookingSummary(draft, null, slotLabel, location, patientName, guestName);

  async function confirm() {
    if (createAppointment.isPending) return;

    const { request, fieldErrors } = buildAppointmentRequest(draft, hcpId);
    if (!request) {
      booking.fail(Object.values(fieldErrors)[0] ?? "Complete the booking details.");
      return;
    }

    try {
      const response = await createAppointment.mutateAsync(request);

      // The returned appointment is the only thing that marks this booked.
      booking.complete({
        date: draft.date ?? "",
        time: draft.time ?? "",
        notes: draft.notes,
        bookingFor: draft.bookingFor,
        guest: draft.bookingFor === "other" ? draft.guest : null,
      });

      toast.success(response.message || "Appointment booked successfully.");
      onRequest?.(doctor, {
        date: draft.date ?? "",
        time: draft.time ?? "",
        notes: draft.notes,
        bookingFor: draft.bookingFor,
        guest: draft.bookingFor === "other" ? draft.guest : null,
      });
    } catch (cause) {
      if (isSlotConflict(cause)) {
        // The slot was taken between reading availability and submitting. The form
        // is not wrong, so its values are kept and the slot list is refreshed.
        booking.fail("That time was just taken. Pick another slot below.");
        void availability.refetch();
        return;
      }

      // 422 field errors stay in the error object for the form to map; the summary
      // line carries the message so the patient sees something concrete.
      booking.fail(getApiErrorMessage(cause));
    }
  }

  return {
    booking,
    createAppointment,
    location,
    summary,
    availability,
    availabilityByDate,
    selectedSlots,
    isWhoDone: draft.bookingFor === "self" || isGuestReady(draft.guest),
    isWhenDone: Boolean(draft.date && draft.time),
    confirm,
  };
};

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

type BookingFormProps = {
  doctor: HCP;
  patient: BookingPatient;
  onClose: () => void;
  onRequest?: OnRequest;
};

const BookingForm: FC<BookingFormProps> = ({ doctor, patient, onClose, onRequest }) => {
  const {
    booking,
    createAppointment,
    location,
    summary,
    availability,
    availabilityByDate,
    selectedSlots,
    isWhoDone,
    isWhenDone,
    confirm,
  } = useBookingForm({ doctor, patient, onRequest });
  const { draft, submitted, error, month, today } = booking;

  return (
    <>
      <BookingHeader doctorName={doctor.fullName} isSubmitted={Boolean(submitted)} />

      <DialogDescription className="sr-only">
        Book a visit with {doctor.fullName}.
      </DialogDescription>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {submitted && summary ? (
          <BookingConfirmation doctor={doctor} summary={summary} />
        ) : (
          <div className="flex flex-col gap-4">
            <DoctorSummary doctor={doctor} location={location} />

            <Panel
              step={1}
              isDone={isWhoDone}
              title="Who is this for?"
              hint="The visit stays on your account either way."
            >
              <BookingForToggle value={draft.bookingFor} onChange={booking.setBookingFor} />
              {draft.bookingFor === "self" ? (
                <PatientIdentityCard patient={patient} />
              ) : (
                <GuestDetailsForm guest={draft.guest} onChange={booking.updateGuest} />
              )}
            </Panel>

            <Panel
              step={2}
              isDone={isWhenDone}
              title="When"
              hint={
                draft.date ? (
                  <span className="font-medium text-primary">{formatLongDate(draft.date)}</span>
                ) : (
                  "Open days are highlighted"
                )
              }
            >
              <MonthCalendar
                month={month}
                today={today}
                selected={draft.date}
                availability={availabilityByDate}
                isLoading={availability.isPending}
                onMonthChange={booking.setMonth}
                onSelect={booking.selectDate}
              />
              <div className="mt-4 border-t border-border pt-4">
                {!draft.date ? (
                  <p className="rounded-lg border border-dashed border-primary/30 bg-accent px-3 py-3 type-label text-pretty text-muted-foreground">
                    Choose an open day. Times for that day appear here.
                  </p>
                ) : availability.isPending ? (
                  <SlotsLoading />
                ) : availability.isError ? (
                  <AvailabilityError onRetry={() => void availability.refetch()} />
                ) : selectedSlots && selectedSlots.length > 0 ? (
                  <TimeSlots
                    slots={selectedSlots}
                    selected={draft.time}
                    onSelect={booking.selectTime}
                  />
                ) : (
                  <p className="rounded-lg border border-dashed border-primary/30 bg-accent px-3 py-3 type-label text-pretty text-muted-foreground">
                    No times are free on this day. Try another open day.
                  </p>
                )}
              </div>
            </Panel>

            <Panel>
              <BookingNotes notes={draft.notes} onChange={booking.setNotes} />
            </Panel>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-card p-4">
        {submitted ? (
          <Button className="h-12 w-full" size="lg" onClick={onClose}>
            Close booking
          </Button>
        ) : (
          <>
            {error ? (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 type-label text-destructive"
              >
                {error}
              </p>
            ) : null}
            <SelectionSummary
              date={draft.date}
              slotLabel={summary?.timeLabel}
              pending={createAppointment.isPending}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button type="button" variant="ghost" className="h-12" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="h-12 flex-1 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]"
                size="lg"
                disabled={!isWhenDone || createAppointment.isPending}
                onClick={() => void confirm()}
              >
                {createAppointment.isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Booking…
                  </>
                ) : (
                  "Confirm visit"
                )}
              </Button>
            </div>
          </>
        )}
      </footer>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

type BookingHeaderProps = {
  doctorName: string;
  isSubmitted: boolean;
};

/** Brand band. The doctor's name lives here so context survives scrolling the body. */
const BookingHeader: FC<BookingHeaderProps> = ({ doctorName, isSubmitted }) => {
  return (
    <header className="flex mx-5 my-3 items-center justify-between gap-2 rounded-4xl bg-primary px-4 py-3 text-primary-foreground">
      <div className="min-w-0">
        <DialogTitle className="type-h3 text-primary-foreground">
          {isSubmitted ? "Visit requested" : "Book appointment"}
        </DialogTitle>
        <p className="type-label text-primary-foreground/80">
          {isSubmitted ? "Saved with your appointments." : `with ${doctorName}`}
        </p>
      </div>
      <DialogClose asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close booking"
          className="size-11 shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </DialogClose>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/* Panels                                                                      */
/* -------------------------------------------------------------------------- */

type StepMarkerProps = {
  step: number;
  isDone: boolean;
};

const StepMarker: FC<StepMarkerProps> = ({ step, isDone }) => {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full type-helper font-medium tabular-nums transition-[background-color,color] duration-200 ease-out",
        isDone ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
      )}
    >
      {isDone ? <Check className="size-3.5" /> : step}
    </span>
  );
};

type PanelProps = {
  title?: string;
  hint?: ReactNode;
  step?: number;
  isDone?: boolean;
  children: ReactNode;
};

/** White L1 surface. 24px radius = 8px inner radius + 16px padding (concentric). */
const Panel: FC<PanelProps> = ({ title, hint, step, isDone = false, children }) => {
  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {step !== undefined ? <StepMarker step={step} isDone={isDone} /> : null}
            <h3 className="type-label text-foreground">
              {step !== undefined ? (
                <span className="sr-only">{`Step ${step}${isDone ? ", complete" : ""}: `}</span>
              ) : null}
              {title}
            </h3>
          </div>
          {hint ? (
            <p className="type-helper text-right text-pretty text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Time slots                                                                  */
/* -------------------------------------------------------------------------- */

type SlotsLoadingProps = { count?: number };

/** Placeholder rows while the availability request is in flight. */
const SlotsLoading: FC<SlotsLoadingProps> = ({ count = 6 }) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 type-label text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Checking available times…
      </p>
      <div className="grid grid-cols-3 gap-2" aria-hidden="true">
        {skeletonKeys(count).map((key) => (
          <div key={key} className="h-11 animate-pulse rounded-lg bg-border/60" />
        ))}
      </div>
    </div>
  );
};

type AvailabilityErrorProps = { onRetry: () => void };

/** Availability could not be loaded; the calendar is still usable. */
const AvailabilityError: FC<AvailabilityErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3">
      <p className="type-label text-destructive">
        We couldn&rsquo;t load the available times for this day.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
};

type TimeSlotsProps = {
  /** The slots the API reported as free for the selected day. */
  slots: HcpAvailabilitySlot[];
  selected: string | null;
  onSelect: (time: string) => void;
};

/**
 * The free times for the selected day, exactly as the API listed them.
 *
 * Nothing is generated here: the list is the backend's, so a slot that is already
 * booked simply is not present.
 */
const TimeSlots: FC<TimeSlotsProps> = ({ slots, selected, onSelect }) => {
  // Mounts once when the first day is picked, so the enter plays then and not on every date change.
  return (
    <div className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
      <p className="type-label text-foreground">Available times</p>
      <p className="mt-1 type-helper text-muted-foreground">Each visit lasts one hour.</p>

      {/*
        A fieldset rather than `div role="group"`: these are one control group, and
        the legend is what names them. Same shape as the appointment filters in
        `PatientAppointments`.
      */}
      <fieldset className="mt-3 border-0 p-0">
        <legend className="sr-only">Available times</legend>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <TimeSlotButton
              key={slot}
              label={formatClockTime(slot)}
              isSelected={selected === slot}
              onClick={() => onSelect(slot)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
};

type TimeSlotButtonProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const TimeSlotButton: FC<TimeSlotButtonProps> = ({ label, isSelected, onClick }) => {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-lg border px-2 type-label tabular-nums outline-none",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        isSelected
          ? "border-primary bg-primary font-medium text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

type SelectionSummaryProps = {
  date: string | null;
  slotLabel: string | undefined;
  pending?: boolean;
};

/** Echoes the choice back so the confirm button never feels blind. */
const SelectionSummary: FC<SelectionSummaryProps> = ({ date, slotLabel, pending }) => {
  if (date && slotLabel) {
    return (
      <p
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 type-label font-medium text-foreground tabular-nums"
      >
        <CalendarCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          {formatLongDate(date)} &middot; {slotLabel}
        </span>
      </p>
    );
  }

  return (
    <p aria-live="polite" className="type-label text-muted-foreground">
      {pending
        ? "Booking your visit…"
        : date
          ? "Choose a time for this day."
          : "Choose an open day to continue."}
    </p>
  );
};
