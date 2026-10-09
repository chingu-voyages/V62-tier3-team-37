/**
 * Appointment domain types.
 *
 * Two shapes live here and they must not be confused:
 *
 * 1. `Appointment` and friends - the wire contract of `POST /api/patient/appointments`.
 *    These are what the backend speaks: snake_case, ISO-8601 timestamps, enums in
 *    upper case.
 * 2. The `UpcomingAppointment`-style record the local appointment store keeps -
 *    a pre-wired client-side shape used by the "Your appointments" screen before
 *    an appointments list endpoint exists. It is not an API type.
 *
 * The API types are only consumed by the booking flow, so they are namespaced by
 * the wire shape rather than by the screen that renders them.
 */

/* -------------------------------------------------------------------------- */
/* Shared enums (API wire values)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Backend appointment status. Distinct from `bookingFor`, which says *who* the
 * visit is for.
 */
export const APPOINTMENT_STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Whether the authenticated patient attends, or someone attends for them. */
export const BOOKING_FOR_VALUES = ["SELF", "OTHER"] as const;

export type ApiBookingFor = (typeof BOOKING_FOR_VALUES)[number];

/** Backend gender enum. The app's own `Gender` is the lowercase UI equivalent. */
export const API_GENDER_VALUES = ["MALE", "FEMALE"] as const;

export type ApiGender = (typeof API_GENDER_VALUES)[number];

/** Every appointment is one hour. */
export const APPOINTMENT_DURATION_MINUTES = 60;

/** The inclusive window the availability endpoint accepts. */
export const AVAILABILITY_RANGE_MAX_DAYS = 31;

export const APPOINTMENT_NOTES_MAX = 2000;
export const ATTENDEE_NAME_MAX = 255;

/* -------------------------------------------------------------------------- */
/* Responses                                                                   */
/* -------------------------------------------------------------------------- */

/** The clinician as the appointments API returns them - a trimmed projection. */
export type AppointmentHcp = {
  id: number;
  name: string;
  profile_photo: string | null;
  specialty: string | null;
};

export type AppointmentPatient = {
  id: number;
  name: string;
};

/** The person attending. For a SELF booking the API echoes the patient's own data. */
export type AppointmentAttendee = {
  first_name: string;
  last_name: string;
  email: string;
  /** `YYYY-MM-DD`. */
  birth_date: string;
  gender: ApiGender;
};

/**
 * A created appointment, exactly as the API returns it.
 *
 * `scheduled_start_at` / `scheduled_end_at` are timestamps, not calendar dates:
 * format them for display and never slice them to compare calendar days. Every
 * nullable field below is genuinely nullable - a confirmed appointment has no
 * cancellation or rescheduling record.
 */
export type Appointment = {
  id: number;
  hcp: AppointmentHcp;
  patient: AppointmentPatient;
  /** ISO-8601 with an offset/zone designator. */
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  booking_for: ApiBookingFor;
  attendee: AppointmentAttendee | null;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by_user_id: number | null;
  cancellation_reason: string | null;
  rescheduled_at: string | null;
  rescheduled_by_user_id: number | null;
};

/** Laravel's `{ message, data }` envelope, which every booking endpoint uses. */
export type CreateAppointmentResponse = {
  message: string;
  data: Appointment;
};

/* -------------------------------------------------------------------------- */
/* Requests                                                                    */
/* -------------------------------------------------------------------------- */

/** The `attendee` object, required only for an OTHER booking. */
export type AppointmentAttendeeInput = {
  first_name: string;
  last_name: string;
  email: string;
  /** `YYYY-MM-DD`, not in the future. */
  birth_date: string;
  gender: ApiGender;
};

/**
 * `POST /api/patient/appointments` body.
 *
 * A discriminated union on `booking_for`, so a SELF booking cannot carry an
 * `attendee` and an OTHER booking cannot omit one. The compiler rejects both
 * mistakes; nothing at runtime has to undo them.
 */
export type CreateAppointmentRequest =
  | {
      hcp_id: number;
      /** ISO-8601 with an explicit offset or `Z`. Never a timezone-less string. */
      scheduled_start_at: string;
      booking_for: "SELF";
      notes?: string | null;
    }
  | {
      hcp_id: number;
      scheduled_start_at: string;
      booking_for: "OTHER";
      attendee: AppointmentAttendeeInput;
      notes?: string | null;
    };

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

/** A 24-hour `HH:mm` slot. The API sends these as bare strings. */
export type HcpAvailabilitySlot = string;

/** One calendar date and what is free on it. `slots` may legitimately be empty. */
export type HcpAvailabilityDate = {
  /** `YYYY-MM-DD`. */
  date: string;
  slots: HcpAvailabilitySlot[];
};

export type HcpAvailabilityResponse = {
  hcp_id: number;
  duration_minutes: number;
  dates: HcpAvailabilityDate[];
};

/** `{ data: {...} }` envelope, matching the other patient endpoints. */
export type HcpAvailabilityEnvelope = {
  data: HcpAvailabilityResponse;
};

/* -------------------------------------------------------------------------- */
/* Client-side store shape                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The pre-wiring record used by `useAppointmentStore` and the "Your appointments"
 * screen.
 *
 * Not an API type: there is no appointments list endpoint yet, so this shape has
 * no server counterpart and its status values are a UI concern.
 */
export type StoreAppointmentStatus = "upcoming" | "postponed" | "completed" | "cancelled";

export type StoreAppointment = {
  id: string;
  doctorName: string;
  specialty: string;
  location: string;
  date: string;
  time: string;
  reason: string;
  status: StoreAppointmentStatus;
};

export type NewStoreAppointment = Omit<StoreAppointment, "id" | "status">;
