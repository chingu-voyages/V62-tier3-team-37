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
 * It deliberately does **not** write to `useAppointmentStore`. That store is a
 * client-side list for a screen that has no appointments endpoint yet, so feeding it
 * a confirmed booking would show the visit in a list the API cannot vouch for. When
 * an appointments list query exists, the created appointment should come from the
 * cache instead.
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
