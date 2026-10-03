import "server-only";

import { cache } from "react";
import { serverRequest } from "@/lib/api/server-client";
import type { ApiHcpProfile, ApiHcpProfileResponse } from "@/types/hcp-profile-api";
import {
  toAvailability,
  toEditableProfile,
  toProfessionalInformation,
  toProfessionalPreferences,
  toProfileIdentity,
  toVerificationSummary,
} from "./hcp-mappers";

/**
 * Server-side reads for the HCP profile area.
 *
 * The API exposes a single `GET /api/hcp/profile`, so all five parallel-route
 * slots project their own slice from one response. That response is memoised per
 * request with React `cache`, which is what makes the split worthwhile: five
 * sections, one upstream call, and each slot still gets its own `loading.tsx`,
 * `error.tsx` and `retry()`.
 *
 * Because there is a single source, the slots also fail together - a per-slot
 * boundary isolates the *retry affordance*, not partial data. That is honest: the
 * backend has no section-scoped read to isolate.
 *
 * Each exported function maps to exactly one slot. Do not add a "get the whole
 * thing" convenience here: the slots are what give the page independent loading and
 * error states, and a combined reader invites collapsing them back into one.
 */

async function fetchHcpProfile(): Promise<ApiHcpProfile> {
  const response = await serverRequest<ApiHcpProfileResponse>("/api/hcp/profile");
  return response.data;
}

const getHcpProfile = cache(fetchHcpProfile);

/** `@overview`: identity, plus the raw names the avatar initials need. */
export async function getHcpProfileIdentity() {
  const profile = await getHcpProfile();

  return {
    identity: toProfileIdentity(profile),
    firstName: profile.personal_information.first_name ?? undefined,
    lastName: profile.personal_information.last_name ?? undefined,
  };
}

/**
 * `@professional`: the display model plus the raw editable values, so the editor is
 * never seeded by parsing a formatted name or date back apart.
 */
export async function getHcpProfessionalSection() {
  const profile = await getHcpProfile();

  return {
    information: toProfessionalInformation(profile),
    editable: toEditableProfile(profile),
  };
}

/** `@details`: bio, languages and consultation types. */
export async function getHcpProfessionalPreferences() {
  return toProfessionalPreferences(await getHcpProfile());
}

/** `@verification`: requirement states and reviewer timestamps. */
export async function getHcpVerificationSummary() {
  return toVerificationSummary(await getHcpProfile());
}

/** `@availability`: grouped day pills plus the raw slots the editor deletes by id. */
export async function getHcpAvailability() {
  return toAvailability((await getHcpProfile()).availability);
}
