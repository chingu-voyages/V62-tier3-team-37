/**
 * Labels for the enum values the admin desk receives.
 *
 * These are presentation-only. Gender goes through `formatEnumLabel` from
 * `lib/format`, which is what both profile surfaces use, so an account reads the
 * same wherever it is shown.
 */

export const NPI_REGISTRY_URL = "https://npiregistry.cms.hhs.gov/search";

/**
 * Mirrors `Specialty::label()` on the API.
 *
 * The desk compares a licence against the public registry, where specialties are
 * spelled the way the registry spells them, so this has to agree with the backend
 * rather than with the directory's wording. A specialty the API adds later falls
 * through to its raw value instead of disappearing.
 */
const SPECIALTIES: Record<string, string> = {
  GENERAL_MEDICINE: "General Medicine",
  CARDIOLOGY: "Cardiology",
  DERMATOLOGY: "Dermatology",
  NEUROLOGY: "Neurology",
  PEDIATRICS: "Pediatrics",
  PSYCHIATRY: "Psychiatry",
  ORTHOPEDICS: "Orthopedics",
  OPHTHALMOLOGY: "Ophthalmology",
  RADIOLOGY: "Radiology",
};

/** Mirrors every case of the API's `DocumentType` enum. */
const DOCUMENTS: Record<string, string> = {
  MEDICAL_EXAMINATION: "Medical examination",
  GOVERNMENT_ID_FRONT: "Government ID, front",
  GOVERNMENT_ID_BACK: "Government ID, back",
  MEDICAL_LICENSE: "Medical license",
  QUALIFICATION: "Qualification",
};

export function specialtyLabel(value: string | null | undefined): string {
  if (!value) return "Not submitted";
  return SPECIALTIES[value] ?? value;
}

export function documentLabel(value: string | null | undefined): string {
  if (!value) return "Document";
  return DOCUMENTS[value] ?? value;
}

/** What the desk should do with this clinician next. */
export function verificationLabel(status: string | null, blocked: boolean): string {
  if (blocked) return "Blocked";
  if (status === "VERIFIED") return "Confirmed";
  if (status === "REJECTED") return "Declined";
  if (status === "UNDER_REVIEW") return "Needs a decision";
  return "Signed up";
}
