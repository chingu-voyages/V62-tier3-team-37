/**
 * Appointment domain types.
 *
 * Everything here is the wire contract of `/api/patient/appointments`: snake_case,
 * ISO-8601 timestamps, enums in upper case. There is deliberately no second
 * client-side appointment shape any more - the screen reads the API's records
 * directly, so there is nothing to keep in sync with them.
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
  /**
   * A storage **path** (`profile-photos/7/ax.jpg`), not a URL - this is what
   * `AppointmentResource` projects, unlike `HcpProfileResource` which sends
   * `profile_photo_url`.
   *
   * Resolve it with `publicStorageUrl` from `@/lib/api/storage` before handing it to
   * an `<img src>`; a bare path resolves against this app's own origin and fails.
   */
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
  created_at: string;
};

/**
 * Laravel's paginator envelope, which `index` returns.
 *
 * `meta` is present even on an empty page, so `total` is the authoritative count
 * rather than `data.length` - they differ whenever the patient has more than one
 * page of visits.
 */
export type AppointmentPageResponse = {
  data: Appointment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/** `{ data: {...} }`, which `show`, `reschedule` and `cancel` all return. */
export type AppointmentEnvelope = {
  data: Appointment;
};

/** `PATCH .../reschedule` body. */
export type RescheduleAppointmentRequest = {
  /** ISO-8601 with an explicit offset or `Z`. */
  scheduled_start_at: string;
};

/** `PATCH .../cancel` body. `reason` is optional and capped at 1000 characters. */
export type CancelAppointmentRequest = {
  reason?: string | null;
};

/** Laravel's `{ message, data }` envelope, which the booking endpoint uses. */
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
/* Presentation                                                                */
/* -------------------------------------------------------------------------- */

/**
 * How an appointment is grouped on the "Your appointments" screen.
 *
 * This is a *view* concern, not a backend one: the API returns a flat, newest-first
 * list with three statuses and no notion of "past". Deriving the split here keeps
 * the filter honest - a cancelled visit in the future is history, and a confirmed
 * visit whose start has passed is history too, whichever way the backend stores it.
 */
export type AppointmentView = "upcoming" | "past";

export const APPOINTMENT_VIEWS: { value: AppointmentView; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];
