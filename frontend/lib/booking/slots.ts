/**
 * Turning a picked slot into the timestamp the appointments API accepts.
 *
 * ## Why this module exists
 *
 * `GET /patient/hcps/{hcp}/availability` returns a *calendar date* (`2030-01-07`)
 * and a *wall-clock slot* (`09:00`) with no timezone, while
 * `POST /patient/appointments` demands an ISO-8601 timestamp carrying an explicit
 * offset or `Z`. Something has to decide what `09:00` means, and it cannot be the
 * browser: a patient booking from another timezone would otherwise book a clinic
 * slot that is hours away from the one on screen.
 *
 * ## The rule
 *
 * A slot is the clinic's local wall-clock time. It is interpreted in the clinic's
 * timezone and sent with that zone's offset, so the clinic receives the instant the
 * patient actually chose.
 *
 * ## Known dependency
 *
 * The contract does not currently carry a timezone: the availability response has no
 * `timezone` field and there is no per-clinician zone on the HCP profile, so the
 * clinic zone cannot be read from the backend yet. Until it can be, the zone comes
 * from configuration (`NEXT_PUBLIC_CLINIC_TIMEZONE`, defaulting to `Africa/Cairo`,
 * matching the rest of the product's market) rather than being invented here.
 *
 * When the backend exposes a clinic timezone, pass the clinician's own zone as
 * `timeZone` - nothing else has to change.
 */

/** The clinic zone used until the API exposes one per clinician. */
export const CLINIC_TIMEZONE = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ?? "Africa/Cairo";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value: number, size = 2) => String(value).padStart(size, "0");

/**
 * A zone's offset in minutes at `instant`, or `null` for a zone `Intl` cannot resolve.
 *
 * Exact for that instant, including across a DST change, because the offset is
 * read from the zone itself rather than assumed.
 */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(instant);
  } catch {
    return null;
  }

  const field: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") field[part.type] = part.value;
  }

  const year = Number(field.year);
  const month = Number(field.month);
  const day = Number(field.day);
  // `hour12: false` can still yield "24" for midnight in some ICU builds.
  const hour = Number(field.hour) % 24;
  const minute = Number(field.minute);
  const second = Number(field.second);

  if ([year, month, day, hour, minute, second].some(Number.isNaN)) return null;

  // The same wall clock, read as if it were UTC, minus the real instant, is the offset.
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asIfUtc - instant.getTime()) / 60000);
}

/**
 * `2030-01-07` + `09:00` in `timeZone` -> `2030-01-07T09:00:00+02:00`.
 *
 * The calendar day and wall-clock time are preserved exactly. The fields are never
 * handed to `new Date(string)`, so a day cannot slip by one because of a timezone -
 * the naive `new Date("2030-01-07T09:00:00Z")` is exactly the mistake this avoids.
 *
 * Returns `null` for a malformed input or an unresolvable zone: a wrong-but-plausible
 * timestamp is worse than declining to submit.
 */
export function slotToIsoTimestamp(
  date: string,
  slot: string,
  timeZone: string = CLINIC_TIMEZONE,
): string | null {
  if (!ISO_DATE_PATTERN.test(date)) return null;

  const match = SLOT_PATTERN.exec(slot);
  if (!match) return null;

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  // `Date.UTC` happily normalises an impossible day - "2030-02-29" becomes March 1 -
  // so the calendar date is checked against its own round-trip before it is used.
  // Without this the patient would be told one thing on screen and the clinic would
  // be sent another.
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  ) {
    return null;
  }

  // First pass asks which offset the zone is on around this wall clock; the second
  // re-checks with that offset applied, so a DST boundary settles correctly instead
  // of being off by an hour.
  let offset = zoneOffsetMinutes(
    new Date(Date.UTC(year, month - 1, day, hours, minutes)),
    timeZone,
  );
  if (offset === null) return null;
  offset = zoneOffsetMinutes(
    new Date(Date.UTC(year, month - 1, day, hours, minutes) - offset * 60000),
    timeZone,
  );
  if (offset === null) return null;

  const instant = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offset * 60000);

  const sign = offset < 0 ? "-" : "+";
  const absolute = Math.abs(offset);
  const offsetLabel = `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;

  // The rendered fields are the inputs by construction: `instant` plus the zone's
  // offset is the original wall clock again.
  const wall = new Date(instant.getTime() + offset * 60000);

  return (
    `${pad(wall.getUTCFullYear(), 4)}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}` +
    `T${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}:${pad(wall.getUTCSeconds())}` +
    offsetLabel
  );
}

/** The zone's offset label at an instant, e.g. `+02:00`. */
export function formatZoneOffset(instant: Date, timeZone: string = CLINIC_TIMEZONE): string | null {
  const offset = zoneOffsetMinutes(instant, timeZone);
  if (offset === null) return null;

  const sign = offset < 0 ? "-" : "+";
  const absolute = Math.abs(offset);
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}
