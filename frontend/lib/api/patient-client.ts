import { apiRequest } from "@/lib/api/client";
import type { PatientProfileResponse } from "@/types/patient-profile";

export type PatientAllergyInput = {
  name: string;
  reaction: string | null;
  severity: string | null;
};

/** Fields a patient may change. Email is not part of this payload. */
export type UpdatePatientProfileInput = {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: "MALE" | "FEMALE";
  phone: string | null;
  country: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  allergies: PatientAllergyInput[];
};

export function updatePatientProfile(
  input: UpdatePatientProfileInput,
): Promise<PatientProfileResponse> {
  return apiRequest<PatientProfileResponse>("/api/patient/profile", {
    method: "PATCH",
    body: input,
  });
}
