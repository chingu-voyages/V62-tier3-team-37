/**
 * Wire types for the patient profile API (`/api/patient/profile`) plus the shared
 * profile photo endpoints.
 *
 * Kept apart from the view models in `@/types/patient-profile` exactly as the
 * HCP profile does: the API speaks snake_case, the UI wants flat display-ready
 * shapes, and `lib/dal/patient-mappers.ts` is the only place that translates.
 *
 * Anything both roles share - the gender enum, the envelope, the photo limits -
 * comes from `@/types/profile-api`.
 */

import type { ApiEnvelope, ApiGender } from "./profile-api";

export type { ApiGender };

/** Mirrors `App\Enums\BloodType`. */
export type ApiBloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

/**
 * One allergy as the validator defines it: a required `name`, optional `reaction`
 * and `severity`.
 */
export type ApiAllergy = {
  name: string;
  reaction?: string | null;
  /** Free text on the wire - `severity` is validated as a string, not as an enum. */
  severity?: string | null;
};

/**
 * An allergy row as it may actually arrive.
 *
 * The column is a plain JSON array with no schema guarantee, and seeded rows hold
 * bare strings (`["Penicillin"]`) while the update validator expects objects
 * (`allergies.*.name`). The mapper normalises both into `ApiAllergy`; the type
 * says so here rather than pretending the wire shape is cleaner than it is.
 */
export type ApiAllergyEntry = ApiAllergy | string;

/**
 * `patient_profile`, as `PatientProfileResource` projects it.
 *
 * Nullable because a user who has never opened this screen has no
 * `patient_profiles` row at all - the resource then answers with `null` rather
 * than a stub object.
 */
export type ApiPatientMedicalProfile = {
  blood_type: ApiBloodType | null;
  height_cm: number | null;
  /** `decimal:2`, so Laravel serialises it as a string (`"61.50"`). */
  weight_kg: number | string | null;
  allergies: ApiAllergyEntry[];
};

export type ApiPatientProfile = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  age: number | null;
  gender: ApiGender | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  /** A storage path, not a URL - see `lib/api/storage`. */
  profile_photo_path: string | null;
  patient_profile: ApiPatientMedicalProfile | null;
};

export type ApiPatientProfileResponse = {
  data: ApiPatientProfile;
};

export type ApiPatientProfileUpdateResponse = ApiEnvelope<ApiPatientProfile>;

/**
 * Everything `PATCH /api/patient/profile` accepts.
 *
 * Note what is absent: `first_name`, `last_name`, `birth_date` and `gender` are
 * not in `UpdatePatientProfileRequest`, so they are read-only on this screen.
 * Offering an input for them could only ever produce a 422.
 */
export type UpdatePatientProfileInput = {
  phone?: string | null;
  country?: string | null;
  blood_type?: ApiBloodType | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  allergies?: ApiAllergy[];
};

/** Matches `UpdatePatientProfileRequest`. */
export const PATIENT_PROFILE_LIMITS = {
  phone: 30,
  country: 100,
  heightMin: 30,
  heightMax: 300,
  weightMin: 1,
  weightMax: 500,
  allergyName: 255,
  allergyReaction: 500,
  allergySeverity: 100,
} as const;

export const BLOOD_TYPES: ApiBloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Severities the editor offers.
 *
 * Suggestions, not a closed set: the backend stores whatever string it is given
 * and validates nothing beyond the length, so an existing free-text value has to
 * survive a round trip through this list unchanged.
 */
export const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
