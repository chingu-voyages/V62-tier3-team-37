import type { ApiBloodType } from "./patient-profile-api";

/**
 * View models for the patient profile sections.
 *
 * Flat and display-ready, the same contract the HCP view models follow:
 * `lib/dal/patient-mappers.ts` builds them from the wire shape, so a component
 * never re-parses a formatted date or splits a name back apart.
 *
 * Fields are optional because "not provided yet" is the normal state for a
 * partially filled-in profile.
 */

export type PatientProfileOverview = {
  photoUrl?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  /** `18 May 1997`, already formatted. */
  birthDate?: string;
  age?: number;
  /** `Female`, already formatted from the enum. */
  gender?: string;
};

/** Raw, form-ready values for the fields `PATCH /api/patient/profile` accepts. */
export type PatientEditableContact = {
  phone: string;
  country: string;
};

export type PatientHealthProfile = {
  bloodType?: ApiBloodType;
  heightCm?: number;
  weightKg?: number;
  /** Derived from height and weight; `undefined` unless both are present. */
  bmi?: number;
};

export type PatientEditableHealth = {
  bloodType: ApiBloodType | "";
  /** Kept as strings so an empty field can mean "clear this". */
  heightCm: string;
  weightKg: string;
};

export type PatientAllergy = {
  name: string;
  reaction?: string;
  severity?: string;
};
