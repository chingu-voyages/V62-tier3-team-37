import { formatCalendarDate, formatEnumLabel } from "@/lib/format";
import type {
  PatientAllergy,
  PatientEditableContact,
  PatientEditableHealth,
  PatientHealthProfile,
  PatientProfileOverview,
} from "@/types/patient-profile";
import type { ApiAllergy, ApiAllergyEntry, ApiPatientProfile } from "@/types/patient-profile-api";

/**
 * Wire shape -> view models for the patient profile.
 *
 * The same discipline as the HCP mapper: display models are built here once, so
 * no component ever parses a formatted date back apart or guesses at a stored
 * shape. The two patient-specific hazards this file defends against:
 *
 * - `weight_kg` is cast `decimal:2`, so it arrives as `"61.50"`, not `61.5`.
 * - `allergies` may hold bare strings (seeded rows) or objects (what the update
 *   validator expects), so both are normalised here rather than in a component.
 */

/** The identity panel: photo, name, and the facts a patient checks first. */
export function toPatientOverview(api: ApiPatientProfile): PatientProfileOverview {
  return {
    fullName: joinName(api.first_name, api.last_name) || undefined,
    email: api.email || undefined,
    phone: api.phone ?? undefined,
    country: api.country ?? undefined,
    birthDate: formatCalendarDate(api.birth_date),
    age: api.age ?? undefined,
    gender: formatEnumLabel(api.gender),
  };
}

/** The raw values the contact editor is seeded from - never a formatted string. */
export function toEditableContact(api: ApiPatientProfile): PatientEditableContact {
  return {
    phone: api.phone ?? "",
    country: api.country ?? "",
  };
}

export function toHealthProfile(api: ApiPatientProfile): PatientHealthProfile {
  const heightCm = toNumber(api.patient_profile?.height_cm);
  const weightKg = toNumber(api.patient_profile?.weight_kg);

  return {
    bloodType: api.patient_profile?.blood_type ?? undefined,
    heightCm,
    weightKg,
    bmi: calculateBmi(heightCm, weightKg),
  };
}

export function toEditableHealth(api: ApiPatientProfile): PatientEditableHealth {
  const heightCm = toNumber(api.patient_profile?.height_cm);
  const weightKg = toNumber(api.patient_profile?.weight_kg);

  return {
    bloodType: api.patient_profile?.blood_type ?? "",
    heightCm: heightCm === undefined ? "" : String(heightCm),
    weightKg: weightKg === undefined ? "" : String(weightKg),
  };
}

export function toAllergies(api: ApiPatientProfile): PatientAllergy[] {
  const entries = api.patient_profile?.allergies ?? [];

  return (
    entries
      .map(toAllergy)
      // A row with no name is not an allergy. The update validator requires one, so
      // keeping such a row would leave the editor unable to save unchanged.
      .filter((allergy): allergy is PatientAllergy => allergy.name.length > 0)
  );
}

function toAllergy(entry: ApiAllergyEntry): PatientAllergy {
  if (typeof entry === "string") return { name: entry.trim() };

  const allergy: ApiAllergy = entry;
  return {
    name: (allergy.name ?? "").trim(),
    reaction: allergy.reaction?.trim() || undefined,
    severity: allergy.severity?.trim() || undefined,
  };
}

/**
 * BMI, or `undefined` unless both inputs are plausible.
 *
 * Derived here rather than in a component so the rule lives in one place, and with
 * a range guard so a mistyped height or weight cannot render a number the patient
 * cannot interpret.
 */
export function calculateBmi(heightCm?: number, weightKg?: number): number | undefined {
  if (heightCm === undefined || weightKg === undefined) return undefined;
  if (heightCm < 50 || heightCm > 300 || weightKg <= 0 || weightKg > 500) return undefined;

  const metres = heightCm / 100;
  const bmi = weightKg / (metres * metres);
  return Math.round(bmi * 10) / 10;
}

/** `166`, `"166.00"` and `166.5` all have to read as numbers. */
function toNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function joinName(first: string | null, last: string | null): string {
  return [first, last]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}
