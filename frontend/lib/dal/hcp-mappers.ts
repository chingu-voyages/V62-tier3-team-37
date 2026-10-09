import type {
  HcpAvailability,
  HcpAvailabilitySlot,
  HcpEditableProfile,
  HcpProfessionalInformation,
  HcpProfessionalPreferences,
  HcpProfileIdentity,
  ProfileVerificationRequirement,
  ProfileVerificationRequirementKey,
  ProfileVerificationState,
  ProfileVerificationSummary,
  WorkingDayKey,
  WorkingHourRange,
} from "@/types/hcp-profile";
import type {
  ApiAvailabilitySlot,
  ApiHcpProfile,
  ApiVerification,
  ApiWorkingDay,
} from "@/types/hcp-profile-api";

function calendarDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function joinLocation(city: string | null | undefined, country: string | null | undefined) {
  const parts = [city, country].map((part) => part?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/** `MALE` -> `Male`, for display. The enum stays uppercase on the wire. */
function formatGender(gender: string | null | undefined): string | undefined {
  if (!gender) return undefined;
  return titleCase(gender);
}

export function toProfileIdentity(profile: ApiHcpProfile): HcpProfileIdentity {
  const personal = profile.personal_information;
  const professional = profile.professional_information;

  return {
    photoUrl: profile.profile_photo_url ?? undefined,
    fullName: personal.full_name || undefined,
    specialty: professional.specialty || undefined,
    isVerified: profile.is_verified,
    dateOfBirth: calendarDate(personal.birth_date),
    age: personal.age ?? undefined,
    gender: formatGender(personal.gender),
    phone: personal.phone ?? undefined,
    email: personal.email || undefined,
    location: joinLocation(professional.city, personal.country),
    workplaceName: professional.workplace_name ?? undefined,
    workplaceAddress: professional.workplace_address ?? undefined,
  };
}

export function toProfessionalInformation(profile: ApiHcpProfile): HcpProfessionalInformation {
  const personal = profile.personal_information;
  const professional = profile.professional_information;

  return {
    fullName: personal.full_name || undefined,
    dateOfBirth: calendarDate(personal.birth_date),
    gender: formatGender(personal.gender),
    phone: personal.phone ?? undefined,
    email: personal.email ?? undefined,
    specialty: professional.specialty || undefined,
    subSpecialty: professional.sub_specialty ?? undefined,
    yearsOfExperience: professional.years_of_experience ?? undefined,
    medicalLicenseNumber: professional.medical_license_number || undefined,
    licenseIssuingAuthority: professional.license_issuing_authority || undefined,
    workplaceName: professional.workplace_name ?? undefined,
    workplaceAddress: professional.workplace_address ?? undefined,
    location: joinLocation(professional.city, personal.country),
    area: professional.area ?? undefined,
    fees: professional.fees ?? undefined,
    currency: professional.currency ?? undefined,
    waitingTime: professional.waiting_time ?? undefined,
    insuranceAccepted: professional.insurance_accepted,
    rating: professional.rating ?? undefined,
    reviewCount: professional.review_count ?? undefined,
  };
}

export function toProfessionalPreferences(profile: ApiHcpProfile): HcpProfessionalPreferences {
  return {
    languages: profile.preferences.languages,
    consultationTypes: profile.preferences.consultation_types,
    bio: profile.preferences.bio ?? undefined,
  };
}

function toWorkingDay(day: ApiWorkingDay): WorkingDayKey {
  // ApiWorkingDay and WorkingDayKey share members; this keeps the compiler honest.
  return day as WorkingDayKey;
}

const DAY_ORDER: WorkingDayKey[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function compareDays(left: WorkingDayKey, right: WorkingDayKey): number {
  return DAY_ORDER.indexOf(left) - DAY_ORDER.indexOf(right);
}

/**
 * The raw values `PATCH /api/hcp/profile` accepts, straight off the wire.
 *
 * Deliberately separate from the display models: a form must never be seeded by
 * parsing a rendered string. Splitting `full_name` back into first/last breaks on
 * multi-word surnames, and reformatting `birth_date` into "8 Apr 1993" would send
 * an unparseable value back to a `YYYY-MM-DD` field.
 *
 * Nulls collapse to `""` here rather than being carried through. A controlled
 * `<input value={null}>` renders as an uncontrolled input and warns, and
 * `draft.birthDate.trim()` would throw outright. The editor already treats `""` as
 * "not provided" and omits the field from the PATCH, so nothing is lost.
 */
export function toEditableProfile(profile: ApiHcpProfile): HcpEditableProfile {
  const personal = profile.personal_information;
  const professional = profile.professional_information;

  return {
    firstName: personal.first_name ?? "",
    lastName: personal.last_name ?? "",
    birthDate: personal.birth_date ?? "",
    gender: personal.gender ?? "",
    phone: personal.phone ?? "",
    country: personal.country ?? "",
    subSpecialty: professional.sub_specialty ?? "",
    workplaceName: professional.workplace_name ?? "",
    workplaceAddress: professional.workplace_address ?? "",
    city: professional.city ?? "",
    area: professional.area ?? "",
    fees:
      professional.fees === null || professional.fees === undefined
        ? ""
        : String(professional.fees),
    currency: professional.currency ?? "",
    waitingTime: professional.waiting_time ?? "",
    insuranceAccepted: [...professional.insurance_accepted],
  };
}

export function toAvailability(slots: ApiAvailabilitySlot[] | undefined): HcpAvailability {
  const list = slots ?? [];

  const grouped = new Map<string, Set<WorkingDayKey>>();
  for (const slot of list) {
    const key = `${slot.start_time}-${slot.end_time}`;
    const days = grouped.get(key) ?? new Set<WorkingDayKey>();
    days.add(toWorkingDay(slot.day));
    grouped.set(key, days);
  }

  const ranges: WorkingHourRange[] = [...grouped.entries()]
    .map(([key, days]) => {
      const [startTime, endTime] = key.split("-");
      return { startTime, endTime, days: [...days].sort(compareDays) };
    })
    .sort((left, right) => left.startTime.localeCompare(right.startTime));

  const workingDays = [...new Set(list.map((slot) => toWorkingDay(slot.day)))].sort(compareDays);

  const rawSlots: HcpAvailabilitySlot[] = list.map((slot) => ({
    id: slot.id,
    day: toWorkingDay(slot.day),
    startTime: slot.start_time,
    endTime: slot.end_time,
  }));

  return { workingDays, ranges, slots: rawSlots };
}

function overallState(verification: ApiVerification): ProfileVerificationState {
  switch (verification.status) {
    case "VERIFIED":
      return "VERIFIED";
    case "REJECTED":
      return "REJECTED";
    case "UNDER_REVIEW":
      return "PENDING";
    default:
      return "PENDING";
  }
}

/** A requirement counts as met only once the reviewer has approved it. */
function documentState(
  uploaded: boolean,
  overall: ProfileVerificationState,
  rejected: boolean,
): ProfileVerificationState {
  if (rejected) return "REJECTED";
  if (!uploaded) return "PENDING";
  return overall === "VERIFIED" ? "VERIFIED" : "IN_PROGRESS";
}

export function toVerificationSummary(profile: ApiHcpProfile): ProfileVerificationSummary {
  const verification = profile.verification;
  const overall = overallState(verification);
  const rejected = overall === "REJECTED";
  const documents = verification.documents;

  const requirements: Record<ProfileVerificationRequirementKey, ProfileVerificationState> = {
    identity: documentState(
      documents.government_id_front && documents.government_id_back,
      overall,
      rejected,
    ),
    professional_license: documentState(documents.medical_license, overall, rejected),
    degree_certifications: documentState(documents.qualification, overall, rejected),
    credential_documents: documentState(documents.qualification, overall, rejected),
    kyc_liveness:
      verification.liveness_status === "PASSED"
        ? "VERIFIED"
        : verification.liveness_status === "FAILED"
          ? "NEEDS_MORE_INFORMATION"
          : "PENDING",
  };

  const ordered: ProfileVerificationRequirement[] = (
    [
      "identity",
      "professional_license",
      "degree_certifications",
      "credential_documents",
      "kyc_liveness",
    ] as const
  ).map((key) => ({ key, state: requirements[key] }));

  return {
    overall,
    requirements: ordered,
    lastVerifiedAt: verification.reviewed_at ?? undefined,
    rejectionReason: verification.rejection_reason ?? undefined,
  };
}
