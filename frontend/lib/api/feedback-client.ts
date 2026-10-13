import { apiRequest } from "@/lib/api/client";

/**
 * Patient reviews and reports against a clinician.
 *
 * `comment` and `details` are sent as `null` rather than an empty string so the
 * API stores "no comment" instead of a blank one.
 */
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
