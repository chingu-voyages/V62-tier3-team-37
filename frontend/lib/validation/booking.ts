import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";
import {
  type ApiBookingFor,
  ATTENDEE_NAME_MAX,
  AVAILABILITY_RANGE_MAX_DAYS,
  BOOKING_FOR_VALUES,
} from "@/types/appointment";

/**
 * Booking form validation.
 *
 * These gate the submit so an incomplete form never reaches the API, but they are
 * deliberately not the authority: Laravel re-validates everything, and its field
 * errors are mapped back onto these same fields. Mirroring the documented limits
 * here only saves the patient a round trip - it never replaces the server's check.
 */

/** The app renders gender lowercase; the API enum is upper case. */
const apiGenderSchema = z.enum(["MALE", "FEMALE"], {
  message: "Select a gender",
});

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

/** Today, as the calendar speaks it, so the comparison never crosses a timezone. */
function todayIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * A birth date must be a real day in the past.
 *
 * Checked as a calendar date: `new Date("2030-02-29")` would roll into March, so
 * the field is compared against today's ISO string rather than parsed.
 */
const attendeeBirthDateSchema = isoDateSchema.refine(
  (value) => value <= todayIsoDate(),
  "Date of birth cannot be in the future",
);

export const attendeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(ATTENDEE_NAME_MAX, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(ATTENDEE_NAME_MAX, "Last name is too long"),
  email: emailSchema,
  birthDate: attendeeBirthDateSchema,
  gender: apiGenderSchema,
});

export type AttendeeFormValues = z.infer<typeof attendeeSchema>;

/** `booking_for` is the discriminator the request union is keyed on. */
export const bookingForSchema = z.enum(BOOKING_FOR_VALUES, {
  message: "Choose who the visit is for",
});

/**
 * The values the booking form collects before it becomes an API request.
 *
 * `date` and `time` are held as the slot the availability endpoint returned
 * (`YYYY-MM-DD` and `HH:mm`); the ISO-8601 timestamp is derived at submit time,
 * not stored, so a timezone change cannot leave a stale timestamp behind.
 */
export const bookingFormSchema = z
  .object({
    hcpId: z.number().int().positive("Choose a healthcare professional"),
    date: isoDateSchema,
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Choose a time"),
    bookingFor: bookingForSchema,
    notes: z.string().trim().max(2000, "Notes are too long"),
    attendee: attendeeSchema.optional(),
  })
  .superRefine((values, ctx) => {
    // An OTHER booking is invalid without a complete attendee, and a SELF booking
    // must not carry one. Enforcing both directions here means the form cannot
    // produce the mismatched payloads the request union forbids.
    if (values.bookingFor === "OTHER" && !values.attendee) {
      ctx.addIssue({
        code: "custom",
        path: ["attendee"],
        message: "Enter the other person's details",
      });
    }

    if (values.bookingFor === "SELF" && values.attendee) {
      ctx.addIssue({
        code: "custom",
        path: ["attendee"],
        message: "Attendee details are not used for your own visit",
      });
    }
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

/** Convenience for the toggle, which stores the UI's lowercase label. */
export function toApiBookingFor(value: "self" | "other"): ApiBookingFor {
  return value === "other" ? "OTHER" : "SELF";
}

/** One calendar day. */
export const isoDateFieldSchema = isoDateSchema;

/** A `from`/`to` pair the availability endpoint will accept. */
export function isValidAvailabilityRange(from: string, to: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(from) || !datePattern.test(to)) return false;
  if (from > to) return false;

  const spanDays = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const inclusive = (spanDays(to) - spanDays(from)) / 86_400_000 + 1;
  return inclusive >= 1 && inclusive <= AVAILABILITY_RANGE_MAX_DAYS;
}
