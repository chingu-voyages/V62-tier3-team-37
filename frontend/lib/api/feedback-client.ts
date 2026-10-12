import { apiRequest } from "@/lib/api/client";

export function saveClinicianReview(
  clinicianId: number,
  rating: number,
  comment: string,
): Promise<{ message: string }> {
  return apiRequest(`/api/patient/clinicians/${clinicianId}/reviews`, {
    method: "POST",
    body: { rating, comment: comment.trim() || null },
  });
}

export function sendClinicianReport(
  clinicianId: number,
  reason: string,
  details: string,
): Promise<{ message: string }> {
  return apiRequest(`/api/patient/clinicians/${clinicianId}/reports`, {
    method: "POST",
    body: { reason: reason.trim(), details: details.trim() || null },
  });
}
