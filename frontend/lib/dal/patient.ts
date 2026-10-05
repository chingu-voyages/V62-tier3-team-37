import "server-only";

import { cache } from "react";
import { serverRequest } from "@/lib/api/server-client";
import type { PatientProfile, PatientProfileResponse } from "@/types/patient-profile";

async function fetchPatientProfile(): Promise<PatientProfile> {
  const response = await serverRequest<PatientProfileResponse>("/api/patient/profile");
  return response.data;
}

/** The signed-in patient's account and health details. One call per request. */
export const getPatientProfile = cache(fetchPatientProfile);
