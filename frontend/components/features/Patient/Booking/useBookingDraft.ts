"use client";

import { useMemo, useState } from "react";
import { startOfDay, startOfMonth } from "@/lib/booking/schedule";
import { slotToIsoTimestamp } from "@/lib/booking/slots";
import { toApiBookingFor } from "@/lib/validation/booking";
import { fieldErrorsFrom } from "@/lib/validation/schemas";
import type {
  ApiBookingFor,
  AppointmentAttendeeInput,
  CreateAppointmentRequest,
} from "@/types/appointment";
import type { Gender } from "@/types/auth";

import type { BookingSummary } from "./BookingConfirmation";
import { EMPTY_GUEST } from "./booking-constants";
import type { BookingDraft, BookingGuest, BookingRequest } from "./booking-types";

/** How long the calendar may look ahead when asking for availability. */
export const BOOKING_WINDOW_DAYS = 31;

export function toAttendeeInput(guest: BookingGuest): AppointmentAttendeeInput {
  return {
    first_name: guest.firstName.trim(),
    last_name: guest.lastName.trim(),
    email: guest.email.trim(),
    birth_date: guest.birthDate,
    gender: (guest.gender ?? "FEMALE").toUpperCase() as AppointmentAttendeeInput["gender"],
  };
}

/**
 * Build the API body from the draft.
 *
 * Returns the typed request, or an error keyed by field when the draft is not
 * yet submittable. The discriminated union is constructed here - not in the
 * component - so a SELF booking is physically unable to carry an attendee.
 *
 * `scheduled_start_at` is derived from the clinic's timezone at the moment of
 * submission, which is why it is not part of the draft: a stale timestamp cannot
 * be left sitting in state after a timezone change.
 */
export function buildAppointmentRequest(
  draft: BookingDraft,
  hcpId: number,
): { request?: CreateAppointmentRequest; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  if (!hcpId || hcpId <= 0) {
    fieldErrors.hcpId = "Choose a healthcare professional";
  }
  if (!draft.date) {
    fieldErrors.date = "Choose a date";
  }
  if (!draft.time) {
    fieldErrors.time = "Choose a time";
  }

  if (draft.bookingFor === "other") {
    if (!isGuestComplete(draft.guest)) {
      fieldErrors.guest = "Enter the other person's name, email, date of birth, and gender.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const scheduledStartAt = slotToIsoTimestamp(draft.date as string, draft.time as string);
  if (!scheduledStartAt) {
    // The slot was valid a moment ago, so this means the calendar or the configured
    // clinic zone is unusable - a reason to stop rather than send a guessed time.
    fieldErrors.time = "That time cannot be booked. Please choose another.";
    return { fieldErrors };
  }

  const notes = draft.notes.trim();
  const bookingFor: ApiBookingFor = toApiBookingFor(draft.bookingFor);

  if (bookingFor === "SELF") {
    return {
      request: {
        hcp_id: hcpId,
        scheduled_start_at: scheduledStartAt,
        booking_for: "SELF",
        ...(notes ? { notes } : {}),
      },
      fieldErrors,
    };
  }

  return {
    request: {
      hcp_id: hcpId,
      scheduled_start_at: scheduledStartAt,
      booking_for: "OTHER",
      attendee: toAttendeeInput(draft.guest),
      ...(notes ? { notes } : {}),
    },
    fieldErrors,
  };
}

/**
 * All booking form state in one place.
 *
 * The panel stays a layout component; this hook owns the draft, the validation
 * gate, and the mapping from a draft to a submitted request.
 */
export function useBookingDraft() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [draft, setDraft] = useState<BookingDraft>({
    bookingFor: "self",
    date: null,
    time: null,
    notes: "",
    guest: EMPTY_GUEST,
  });
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(changes: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setError(null);
  }

  /** A new day invalidates the slot, which belongs to the previous one. */
  function selectDate(date: string) {
    patch({ date, time: null });
  }

  function updateGuest(field: keyof BookingGuest, value: string) {
    patch({
      guest: { ...draft.guest, [field]: field === "gender" ? (value as Gender) : value },
    });
  }

  return {
    draft,
    submitted,
    error,
    month,
    today,
    setMonth,
    setBookingFor: (bookingFor: BookingDraft["bookingFor"]) => patch({ bookingFor }),
    selectDate,
    selectTime: (time: string) => patch({ time }),
    updateGuest,
    setNotes: (notes: string) => patch({ notes }),
    /**
     * Records a successful submission so the panel can show its confirmation.
     * Driven by the API response, never by the click.
     */
    complete(request: BookingRequest) {
      setError(null);
      setSubmitted(request);
    },
    /** Shows a message without discarding the draft, so nothing typed is lost. */
    fail(message: string) {
      setError(message);
    },
  };
}

/** Resolves the draft into display copy, or `null` while it is still incomplete. */
export function bookingSummary(
  draft: BookingDraft,
  submitted: BookingRequest | null,
  slotLabel: string | undefined,
  location: string,
  patientName: string,
  guestName: string,
): BookingSummary | null {
  const source = submitted ?? draft;
  if (!source.date || !source.time || !slotLabel) return null;

  return {
    date: source.date,
    timeLabel: slotLabel,
    location,
    forName: source.bookingFor === "other" ? guestName || "Someone else" : patientName || "You",
    notes: source.notes,
  };
}

function isGuestComplete(guest: BookingGuest): boolean {
  return Boolean(
    guest.firstName.trim() &&
      guest.lastName.trim() &&
      guest.email.trim() &&
      guest.birthDate &&
      guest.gender,
  );
}

export { fieldErrorsFrom };
