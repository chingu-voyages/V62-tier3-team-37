import type { BookingFor, BookingGuest, BookingPatient } from "./booking-types";

export const BOOKING_RECIPIENTS: { value: BookingFor; label: string }[] = [
  { value: "self", label: "Myself" },
  { value: "other", label: "Someone else" },
];

export const EMPTY_PATIENT: BookingPatient = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: null,
  gender: null,
};

export const EMPTY_GUEST: BookingGuest = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  gender: null,
};
