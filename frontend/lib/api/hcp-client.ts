import { type ApiMessageResponse, apiRequest } from "@/lib/api/client";
import type { HcpOnboardingResponse } from "@/types/hcp-directory";

/**
 * HCP endpoints, called from the browser.
 *
 * Onboarding submits four documents plus a liveness result in one multipart
 * body (up to 40 MB), which exceeds the Server Actions body limit — so this stays
 * a direct client request. Server-side reads live in `@/lib/dal/hcp`.
 */

export type HcpOnboardingPayload = {
  governmentIdFront: File;
  governmentIdBack: File;
  medicalLicense: File;
  qualification: File;
  livenessStatus: "PASSED";
  medicalLicenseNumber: string;
  licenseIssuingAuthority: string;
  specialty: string;
  yearsOfExperience: number;
  /** Sent verbatim. Never hard-coded — this is a recorded legal consent. */
  consent: boolean;
};

export type HcpOnboardingSubmitResult = ApiMessageResponse & HcpOnboardingResponse;

export function submitHcpOnboarding(
  payload: HcpOnboardingPayload,
): Promise<HcpOnboardingSubmitResult> {
  const formData = new FormData();

  formData.append("government_id_front", payload.governmentIdFront);
  formData.append("government_id_back", payload.governmentIdBack);
  formData.append("medical_license", payload.medicalLicense);
  formData.append("qualification", payload.qualification);
  formData.append("liveness_status", payload.livenessStatus);
  formData.append("medical_license_number", payload.medicalLicenseNumber);
  formData.append("license_issuing_authority", payload.licenseIssuingAuthority);
  formData.append("specialty", payload.specialty);
  formData.append(
    "years_of_experience",
    Number.isFinite(payload.yearsOfExperience) ? String(payload.yearsOfExperience) : "",
  );
  formData.append("consent", String(payload.consent));

  return apiRequest<HcpOnboardingSubmitResult>("/hcp/onboarding", {
    method: "POST",
    body: formData,
  });
}
