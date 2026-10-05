export type PatientAllergy = {
  name?: string | null;
  reaction?: string | null;
  severity?: string | null;
};

export type PatientProfileDetails = {
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: string | number | null;
  allergies: Array<PatientAllergy | string> | null;
};

/** `GET /api/patient/profile`, inside Laravel's `data` wrapper. */
export type PatientProfile = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  profile_photo_path: string | null;
  patient_profile: PatientProfileDetails | null;
};

export type PatientProfileResponse = {
  data: PatientProfile;
};
