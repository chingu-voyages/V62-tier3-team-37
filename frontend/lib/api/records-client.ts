import { apiRequest } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export function uploadMedicalExaminations(title: string, files: File[]): Promise<{ message: string }> {
  const body = new FormData();
  if (title.trim()) body.append("title", title.trim());
  for (const file of files) body.append("files[]", file);
  return apiRequest("/api/patient/medical-examinations", { method: "POST", body });
}

export function deleteMedicalExamination(id: number): Promise<{ message: string }> {
  return apiRequest(`/api/patient/medical-examinations/${id}`, { method: "DELETE" });
}

export async function openMedicalExamination(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/patient/medical-examinations/${id}`, {
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
