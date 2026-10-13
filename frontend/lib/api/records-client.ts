import { apiRequest } from "@/lib/api/client";

import { API_ORIGIN } from "./base-url";

export type MedicalExamination = {
  id: number;
  title: string | null;
  original_file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_at: string | null;
};

export function listMedicalExaminations(): Promise<{ data: MedicalExamination[] }> {
  return apiRequest("/api/patient/medical-examinations");
}

/**
 * Multipart upload. `apiRequest` passes a `FormData` body through untouched, so
 * the browser sets the multipart boundary itself and no header is needed here.
 */
export function uploadMedicalExaminations(
  title: string,
  files: File[],
): Promise<{ message: string }> {
  const body = new FormData();
  if (title.trim()) body.append("title", title.trim());
  for (const file of files) body.append("files[]", file);
  return apiRequest("/api/patient/medical-examinations", { method: "POST", body });
}

export function deleteMedicalExamination(id: number): Promise<{ message: string }> {
  return apiRequest(`/api/patient/medical-examinations/${id}`, { method: "DELETE" });
}

/**
 * Open a stored file in a new tab.
 *
 * Goes through `fetch` rather than a plain link because the endpoint needs the
 * session cookie; a bare `<a href>` would be an unauthenticated request. The blob
 * is handed to a temporary object URL and revoked after a minute so the tab can
 * finish loading large scans.
 */
export async function openMedicalExamination(id: number): Promise<void> {
  const response = await fetch(`${API_ORIGIN}/api/patient/medical-examinations/${id}`, {
    credentials: "include",
    headers: { accept: "*/*" },
  });
  if (!response.ok) {
    throw new Error("That file could not be opened.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
