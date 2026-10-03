/**
 * Wire types for the HCP profile API (`/api/hcp/profile`).
 *
 * Kept separate from the view models the components render. The API speaks
 * snake_case and nests by concern (`personal_information`,
 * `professional_information`, …); the UI wants flat, display-ready shapes.
 * `lib/dal/hcp-mappers.ts` is the only place that translates between them, so a
 * backend rename touches one mapper instead of five components.
 */

export type ApiGender = "MALE" | "FEMALE";

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

export type ApiPersonalInformation = {
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  age: number;
  gender: ApiGender;
  email: string;
  phone: string | null;
  country: string | null;
};

export type ApiProfessionalInformation = {
  specialty: string;
  years_of_experience: number;
  medical_license_number: string;
  license_issuing_authority: string;
  sub_specialty: string | null;
  workplace_name: string | null;
  workplace_address: string | null;
  city: string | null;
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

/** Every mutating endpoint answers with `{ message, data }`. */
export type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export type ApiHcpProfileResponse = ApiEnvelope<ApiHcpProfile>;

export type ApiProfilePhotoResponse = ApiEnvelope<{
  profile_photo_path: string;
  profile_photo_url: string;
}>;

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
  bio?: string | null;
  languages?: string[];
  consultation_types?: ApiConsultationType[];
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
  bio: 2000,
  languages: 10,
  languageLength: 50,
  consultationTypes: 3,
  availabilitySlots: 35,
  photoBytes: 5 * 1024 * 1024,
} as const;

export const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const CONSULTATION_TYPE_LABELS: Record<ApiConsultationType, string> = {
  IN_PERSON: "In person",
  VIDEO: "Video call",
  PHONE: "Phone call",
};
