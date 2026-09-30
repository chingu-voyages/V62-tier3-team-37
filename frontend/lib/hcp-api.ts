import { type ApiMessageResponse, apiRequest } from "@/lib/api";
import type { HcpOnboardingResponse } from "@/types/hcp";

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
  formData.append("years_of_experience", String(payload.yearsOfExperience));
  formData.append("consent", "true");

  return apiRequest<HcpOnboardingSubmitResult>("/hcp/onboarding", {
    method: "POST",
    body: formData,
  });
}
