import type { Gender } from "@/types/auth";

/** Which of the two identities on the account the visit is for. */
export type BookingFor = "self" | "other";

/**
 * The signed-in patient's own details, as shown on the "Myself" tab.
 *
 * Every field is nullable because a partial profile is legitimate; the identity
 * card renders "Not added" rather than pretending the data exists.
 */
export type BookingPatient = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string | null;
  /** Normalised to the app's lowercase form; the API sends `MALE` / `FEMALE`. */
  gender: Gender | null;
};

/** The details typed in for a visit booked on someone else's behalf. */
export type BookingGuest = {
  firstName: string;
  lastName: string;
  email: string;
  /** `YYYY-MM-DD`, the value a `<input type="date">` speaks. */
  birthDate: string;
  gender: Gender | null;
};

/** Everything the form collects, before it is valid enough to submit. */
export type BookingDraft = {
  bookingFor: BookingFor;
  date: string | null;
  time: string | null;
  notes: string;
  guest: BookingGuest;
};

/** A validated submission. `guest` is `null` whenever the visit is for the patient. */
export type BookingRequest = {
  date: string;
  time: string;
  notes: string;
  bookingFor: BookingFor;
  guest: BookingGuest | null;
};
