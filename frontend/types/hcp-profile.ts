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
  workplaceName?: string;
  workplaceAddress?: string;
  location?: string;
};

export type HcpProfessionalPreferences = {
  languages?: string[];
  consultationTypes?: string[];
  bio?: string;
};

export type WorkingDayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type WorkingHourRange = {
  startTime: string;
  endTime: string;
  days: WorkingDayKey[];
};

export type HcpAvailability = {
  workingDays?: WorkingDayKey[];
  ranges?: WorkingHourRange[];
};
