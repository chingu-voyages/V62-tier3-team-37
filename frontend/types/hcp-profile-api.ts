/**
 * Wire types for the HCP profile API (`/api/hcp/profile`).
 *
 * Kept separate from the view models the components render. The API speaks
 * snake_case and nests by concern (`personal_information`,
 * `professional_information`, …); the UI wants flat, display-ready shapes.
 * `lib/dal/hcp-mappers.ts` is the only place that translates between them, so a
 * backend rename touches one mapper instead of five components.
 *
 * Anything both roles share - the gender enum, the photo limits - comes from
 * `@/types/profile-api`, so the patient profile and this module cannot disagree
 * about what the API accepts.
 */

import type { ApiEnvelope, ApiGender } from "./profile-api";

/**
 * Re-exported rather than redefined: the patient profile sends and receives the
 * same enum, and two declarations of `ApiGender` could drift.
 */
export type { ApiEnvelope, ApiGender };

export type ApiConsultationType = "IN_PERSON" | "VIDEO" | "PHONE";

export type ApiWorkingDay = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type ApiVerificationStatus = "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

export type ApiLivenessStatus = "PASSED" | "FAILED";

export type ApiAvailabilitySlot = {
  id: number;
  day: ApiWorkingDay;
  /** `HH:mm`, 24-hour. */
  start_time: string;
  end_time: string;
};

export type ApiVerificationDocuments = {
  government_id_front: boolean;
  government_id_back: boolean;
  medical_license: boolean;
  qualification: boolean;
};

export type ApiVerification = {
  status: ApiVerificationStatus | null;
  liveness_status: ApiLivenessStatus | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  documents: ApiVerificationDocuments;
};

/**
 * `HcpProfileResource` builds these with nullsafe operators throughout
 * (`$user->birth_date ? ... : null`, `$profile?->specialty?->value`), so a provider
 * who has not finished onboarding - or has no `hcp_profiles` row at all - is
 * answered with `null` for most of these fields, not `""` and not an omitted key.
 *
 * The published spec lists them as required, which is true only for a fully
 * onboarded provider. Widening them here keeps the types honest; without it a
 * missing `birth_date` reaches `EditProfileForm` as `null` and `.trim()` throws.
 */
export type ApiPersonalInformation = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  birth_date: string | null;
  age: number | null;
  gender: ApiGender | null;
  email: string | null;
  phone: string | null;
  country: string | null;
};

export type ApiProfessionalInformation = {
  specialty: string | null;
  years_of_experience: number | null;
  medical_license_number: string | null;
  license_issuing_authority: string | null;
  sub_specialty: string | null;
  workplace_name: string | null;
  workplace_address: string | null;
  city: string | null;
  area: string | null;
  fees: number | null;
  currency: string | null;
  waiting_time: string | null;
  insurance_accepted: string[];
  /** Aggregate of patient reviews. Read-only; rejected on write. */
  rating: number | null;
  review_count: number | null;
};

export type ApiPreferences = {
  bio: string | null;
  languages: string[];
  consultation_types: ApiConsultationType[];
};

export type ApiHcpProfile = {
  id: number;
  profile_photo_url: string | null;
  is_verified: boolean;

  personal_information: ApiPersonalInformation;
  professional_information: ApiProfessionalInformation;
  preferences: ApiPreferences;
  availability: ApiAvailabilitySlot[];
  verification: ApiVerification;
};

/**
 * The envelope and the photo response come from `@/types/profile-api`: both are
 * the API's conventions, shared with the patient profile rather than owned here.
 */
export type ApiHcpProfileResponse = ApiEnvelope<ApiHcpProfile>;

export type UpdateHcpProfileInput = {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: ApiGender;
  phone?: string | null;
  country?: string | null;
  sub_specialty?: string | null;
  workplace_name?: string | null;
  workplace_address?: string | null;
  city?: string | null;
  area?: string | null;
  fees?: number | null;
  currency?: string | null;
  waiting_time?: string | null;
  insurance_accepted?: string[];
  bio?: string | null;
  languages?: string[];
  consultation_types?: ApiConsultationType[];
  // `rating` and `review_count` are intentionally absent: the API refuses them,
  // and they are aggregates of patient reviews rather than clinician input.
};

export type ReplaceAvailabilityInput = {
  slots: { day: ApiWorkingDay; start_time: string; end_time: string }[];
};

export const PROFILE_LIMITS = {
  name: 255,
  phone: 30,
  country: 100,
  subSpecialty: 150,
  workplaceName: 255,
  workplaceAddress: 500,
  city: 100,
  area: 100,
  currency: 10,
  waitingTime: 20,
  feesMax: 1000000,
  insuranceCount: 20,
  insuranceLength: 50,
  bio: 2000,
  languages: 10,
  languageLength: 50,
  consultationTypes: 3,
  availabilitySlots: 35,
} as const;

/** Insurers offered in the editor. Kept as suggestions, not a closed set. */
export const COMMON_INSURANCES = ["Medicare", "AXA", "Allianz", "Cigna", "BUPA"] as const;

export const CONSULTATION_TYPE_LABELS: Record<ApiConsultationType, string> = {
  IN_PERSON: "In person",
  VIDEO: "Video call",
  PHONE: "Phone call",
};
