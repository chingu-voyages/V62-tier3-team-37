const LOCALE = "en-GB";

const DATE_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const LONG_DATE_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCalendarDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return DATE_FORMAT.format(parsed);
}

export function formatDateTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return DATE_TIME_FORMAT.format(parsed);
}

export function formatLongDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return LONG_DATE_FORMAT.format(parsed);
}

export function calculateAge(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const now = new Date();
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - parsed.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < parsed.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
}

export function formatClockTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${suffix}`;
}

export function formatAppointmentSlot(date: string, time: string): string {
  const day = formatLongDate(date);
  return day ? `${day} at ${formatClockTime(time)}` : time;
}

/**
 * Enum values the API sends upper-cased, rendered for a reader.
 *
 * `MALE` -> `Male`, `VERIFIED` -> `Verified`. Shared by both profiles so the two
 * surfaces cannot end up presenting the same enum differently.
 */
export function formatEnumLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** `24 years`, pluralised. */
export function formatYears(years: number): string {
  return `${years} ${years === 1 ? "year" : "years"}`;
}
