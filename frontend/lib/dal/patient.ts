import "server-only";

import { cache } from "react";
import { serverRequest } from "@/lib/api/server-client";
import { publicStorageUrl } from "@/lib/api/storage";
import type { ApiPatientProfile, ApiPatientProfileResponse } from "@/types/patient-profile-api";
import {
  toAllergies,
  toEditableContact,
  toEditableHealth,
  toHealthProfile,
  toPatientOverview,
} from "./patient-mappers";

/**
 * Server-side reads for the patient profile area.
 *
 * The API exposes a single `GET /api/patient/profile`, so all three parallel-route
 * slots project their own slice from one response. That response is memoised per
 * request with React `cache`, which is what makes the split worthwhile: three
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

async function fetchPatientProfile(): Promise<ApiPatientProfile> {
  const response = await serverRequest<ApiPatientProfileResponse>("/api/patient/profile");
  return response.data;
}

const getPatientProfile = cache(fetchPatientProfile);

/**
 * `@overview`: identity, plus the raw contact values the editor is seeded from.
 *
 * The photo URL is resolved here rather than in the component because the resource
 * answers with a storage path, and only the server knows the API origin. The raw
 * names travel with it for the avatar initials, which cannot be recovered from a
 * formatted display name.
 */
export async function getPatientProfileOverview() {
  const profile = await getPatientProfile();

  return {
    overview: {
      ...toPatientOverview(profile),
      photoUrl: publicStorageUrl(profile.profile_photo_path),
    },
    editable: toEditableContact(profile),
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
  };
}

/** `@health`: the display model plus the raw editable values, so the editor is never seeded by parsing a rendered number back apart. */
export async function getPatientHealthSection() {
  const profile = await getPatientProfile();

  return {
    health: toHealthProfile(profile),
    editable: toEditableHealth(profile),
  };
}

/** `@allergies`: normalised rows, strings and objects alike. */
export async function getPatientAllergies() {
  const profile = await getPatientProfile();

  return {
    allergies: toAllergies(profile),
  };
}
