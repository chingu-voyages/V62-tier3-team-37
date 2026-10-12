import { apiRequest } from "@/lib/api/client";
import type { AdminAccessRequestRecord, AdminClinicianDetail } from "@/types/admin";

export type AdminAccessRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

export function requestAdminAccess(
  input: AdminAccessRequestInput,
): Promise<{ message: string; data: AdminAccessRequestRecord }> {
  return apiRequest("/api/admin/access-requests", {
    method: "POST",
    body: {
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim(),
      message: input.message.trim() || null,
    },
  });
}

export function blockClinician(id: number): Promise<{ data: AdminClinicianDetail }> {
  return apiRequest(`/api/admin/clinicians/${id}/block`, { method: "POST" });
}

export function unblockClinician(id: number): Promise<{ data: AdminClinicianDetail }> {
  return apiRequest(`/api/admin/clinicians/${id}/unblock`, { method: "POST" });
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function approveAdminAccess(id: number): Promise<{ data: AdminAccessRequestRecord }> {
  return apiRequest(`/api/admin/access-requests/${id}/approve`, { method: "POST" });
}

export function declineAdminAccess(id: number): Promise<{ data: AdminAccessRequestRecord }> {
  return apiRequest(`/api/admin/access-requests/${id}/decline`, { method: "POST" });
}

export function blockPatient(id: number): Promise<{ data: { status: string } }> {
  return apiRequest(`/api/admin/patients/${id}/block`, { method: "POST" });
}

export function unblockPatient(id: number): Promise<{ data: { status: string } }> {
  return apiRequest(`/api/admin/patients/${id}/unblock`, { method: "POST" });
}

export function resolveReport(id: number): Promise<{ data: { status: string } }> {
  return apiRequest(`/api/admin/reports/${id}/resolve`, { method: "POST" });
}

export function dismissReport(id: number): Promise<{ data: { status: string } }> {
  return apiRequest(`/api/admin/reports/${id}/dismiss`, { method: "POST" });
}

export async function openAdminDocument(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/documents/${id}`, {
    credentials: "include",
    headers: { accept: "*/*" },
  });

  if (!response.ok) {
    throw new Error("That document could not be opened.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function decideClinician(
  id: number,
  decision: "VERIFIED" | "REJECTED",
  reason?: string,
): Promise<{ data: AdminClinicianDetail }> {
  return apiRequest(`/api/admin/clinicians/${id}/decision`, {
    method: "POST",
    body: { decision, reason: reason?.trim() || null },
  });
}
