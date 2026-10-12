export const NPI_REGISTRY_URL = "https://npiregistry.cms.hhs.gov/search";

const SPECIALTIES: Record<string, string> = {
  GENERAL_MEDICINE: "General medicine",
  CARDIOLOGY: "Cardiology",
  DERMATOLOGY: "Dermatology",
  NEUROLOGY: "Neurology",
  PEDIATRICS: "Pediatrics",
  PSYCHIATRY: "Psychiatry",
};

const DOCUMENTS: Record<string, string> = {
  GOVERNMENT_ID_FRONT: "Government ID, front",
  GOVERNMENT_ID_BACK: "Government ID, back",
  MEDICAL_LICENSE: "Medical license",
  QUALIFICATION: "Qualification",
  MEDICAL_EXAMINATION: "Medical examination",
};

export function specialtyLabel(value: string | null | undefined): string {
  if (!value) return "Not submitted";
  return SPECIALTIES[value] ?? value;
}

export function documentLabel(value: string | null | undefined): string {
  if (!value) return "Document";
  return DOCUMENTS[value] ?? value;
}

export function genderLabel(value: string | null | undefined): string {
  if (!value) return "Not added";
  if (value === "MALE" || value === "male") return "Male";
  if (value === "FEMALE" || value === "female") return "Female";
  return value;
}

export function verificationLabel(status: string | null, blocked: boolean): string {
  if (blocked) return "Blocked";
  if (status === "VERIFIED") return "Confirmed";
  if (status === "REJECTED") return "Rejected";
  if (status === "UNDER_REVIEW") return "Needs a decision";
  return "Signed up";
}
