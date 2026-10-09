import type { AuthUser, Gender } from "@/types/auth";

import { EMPTY_PATIENT } from "./booking-constants";
import type { BookingPatient } from "./booking-types";

/**
 * `GET /api/user` -> the shape the booking dialog shows on its "Myself" tab.
 *
 * A pure function rather than a component, so the read happens once on the server
 * and the result travels down as a prop: `AppShell` already calls `getOptionalUser()`
 * (memoised per request with React `cache`), so this costs no additional round trip
 * and the card is filled on first paint rather than after a fetch inside the dialog.
 *
 * Lives with the booking feature instead of `lib/dal` because `lib/` must not depend
 * on `components/features`.
 */

/** `MALE` -> `male`. The wire enum is upper-cased; the app's `Gender` is not. */
function toGender(value: string | null | undefined): Gender | null {
  const normalised = value?.trim().toLowerCase();
  return normalised === "male" || normalised === "female" ? normalised : null;
}

/**
 * A signed-out visitor yields `EMPTY_PATIENT`, which the card renders as "Not
 * added" rather than as blank space. The patient area's layout redirects anyone
 * without a session, so this is a defensive default, not a normal state.
 */
export function toBookingPatient(user: AuthUser): BookingPatient {
  if (!user) return EMPTY_PATIENT;

  return {
    firstName: user.first_name?.trim() ?? "",
    lastName: user.last_name?.trim() ?? "",
    email: user.email?.trim() ?? "",
    birthDate: user.birth_date?.trim() || null,
    gender: toGender(user.gender),
  };
}
