import { apiRequest } from "@/lib/api/client";
import type {
  ApiPatientProfileResponse,
  ApiPatientProfileUpdateResponse,
  UpdatePatientProfileInput,
} from "@/types/patient-profile-api";

const PROFILE_ENDPOINT = "/api/patient/profile";

/**
 * Reads and writes the signed-in patient's profile.
 *
 * Both endpoints are scoped server-side to `$request->user()`, so a patient can
 * never read or write another account's row by changing the request - there is no
 * id in the path to tamper with.
 *
 * The photo endpoints are not here: `/api/profile/photo` serves any authenticated
 * user, so it lives in `lib/api/profile-photo-client` and is shared with the HCP
 * profile.
 */

export function fetchPatientProfile(): Promise<ApiPatientProfileResponse> {
  return apiRequest<ApiPatientProfileResponse>(PROFILE_ENDPOINT);
}

export function updatePatientProfile(
  input: UpdatePatientProfileInput,
): Promise<ApiPatientProfileUpdateResponse> {
  return apiRequest<ApiPatientProfileUpdateResponse>(PROFILE_ENDPOINT, {
    method: "PATCH",
    body: pruneUndefined(input),
  });
}

/**
 * `undefined` never reaches the wire.
 *
 * `sometimes` rules in `UpdatePatientProfileRequest` mean an omitted key leaves
 * the stored value alone while an explicit `null` clears it, so the difference
 * between the two is the whole semantics of the request.
 */
function pruneUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
