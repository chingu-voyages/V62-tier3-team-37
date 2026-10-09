"use client";

import type { HCP } from "@/types/hcp-directory";
import { EMPTY_PATIENT } from "../Booking/booking-constants";
import type { BookingPatient, BookingRequest } from "../Booking/booking-types";
import { PatientBookingPanel } from "../Booking/PatientBookingPanel";

export type { BookingPatient, BookingRequest };

type HCPBookingDialogProps = {
  hcp: HCP | null;
  patient?: BookingPatient;
  onClose: () => void;
  /** Fired after the API confirms the booking, with the clinician it was for. */
  onBooked?: (hcp: HCP, request: BookingRequest) => void;
};

/**
 * Booking dialog for the doctor directory.
 *
 * The panel owns the submission; this wrapper only owns the open/closed state and
 * the optional clinician the caller wants to be told about once the backend has
 * confirmed a booking.
 *
 * It deliberately does **not** hold the created appointment in local state. The
 * "Your appointments" list is served by `GET /patient/appointments`, and
 * `useCreateAppointmentMutation` invalidates it on success, so the new visit appears
 * because the API returned it - not because a client-side list was told about it.
 */
export function HCPBookingDialog({
  hcp,
  patient = EMPTY_PATIENT,
  onClose,
  onBooked,
}: HCPBookingDialogProps) {
  return (
    <PatientBookingPanel doctor={hcp} patient={patient} onClose={onClose} onRequest={onBooked} />
  );
}
