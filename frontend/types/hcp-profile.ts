import type { ApiGender } from "@/types/hcp-profile-api";

/**
 * View models for the HCP profile sections.
 *
 * These are what the components render. They are deliberately flat and
 * display-ready; `lib/dal/hcp-mappers.ts` builds them from the API wire shape in
 * `@/types/hcp-profile-api`.
 *
 * Most fields are optional because "not provided yet" is a legitimate state for a
 * partially onboarded HCP. That is also why every section needs an empty state —
 * an all-optional object cannot distinguish "absent" from "not fetched".
 */

export type ProfileVerificationState =
  | "PENDING"
  | "VERIFIED"
  | "IN_PROGRESS"
  | "NEEDS_MORE_INFORMATION"
  | "REJECTED";

export type ProfileVerificationRequirementKey =
  | "identity"
  | "professional_license"
  | "degree_certifications"
  | "credential_documents"
  | "kyc_liveness";

export type ProfileVerificationRequirement = {
  key: ProfileVerificationRequirementKey;
  state: ProfileVerificationState;
};

export type ProfileVerificationSummary = {
  overall: ProfileVerificationState;
  requirements: ProfileVerificationRequirement[];
  lastVerifiedAt?: string;
  /** Present only when the backend rejected the application. */
  rejectionReason?: string;
};

export type HcpProfileIdentity = {
  photoUrl?: string;
  fullName?: string;
  specialty?: string;
  isVerified?: boolean;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  /** City and country, joined for display. */
  location?: string;
  workplaceName?: string;
  workplaceAddress?: string;
};

export type HcpProfessionalInformation = {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  subSpecialty?: string;
  yearsOfExperience?: number;
  medicalLicenseNumber?: string;
  licenseIssuingAuthority?: string;
  workplaceName?: string;
  workplaceAddress?: string;
  location?: string;
  area?: string;
  fees?: number;
  currency?: string;
  waitingTime?: string;
  insuranceAccepted?: string[];
  /** Aggregate of patient reviews. Read-only. */
  rating?: number;
  reviewCount?: number;
};

export type HcpProfessionalPreferences = {
  languages?: string[];
  consultationTypes?: string[];
  bio?: string;
};

/**
 * Raw, form-ready values for the fields `PATCH /api/hcp/profile` accepts.
 *
 * Kept apart from the display models above so a form is never seeded by parsing a
 * rendered string — splitting `full_name` back into first/last breaks on multi-word
 * surnames, and a formatted birth date cannot be submitted to a `YYYY-MM-DD` field.
 */
export type HcpEditableProfile = {
  firstName: string;
  lastName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  gender: ApiGender | "";
  phone: string;
  country: string;
  subSpecialty: string;
  workplaceName: string;
  workplaceAddress: string;
  city: string;
  area: string;
  /** Kept as a string so an empty field can be sent as "clear this". */
  fees: string;
  currency: string;
  waitingTime: string;
  insuranceAccepted: string[];
};

export type WorkingDayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type WorkingHourRange = {
  startTime: string;
  endTime: string;
  days: WorkingDayKey[];
};

export type HcpAvailabilitySlot = {
  id: number;
  day: WorkingDayKey;
  startTime: string;
  endTime: string;
};

/**
 * Availability as the UI needs it, plus the raw slots.
 *
 * The API returns a flat list of `{ day, start_time, end_time }` rows; the card
 * renders grouped ranges. The raw slots are kept because deleting one requires the
 * server-assigned id, which the grouped view has lost.
 */
export type HcpAvailability = {
  workingDays?: WorkingDayKey[];
  ranges?: WorkingHourRange[];
  slots?: HcpAvailabilitySlot[];
};
