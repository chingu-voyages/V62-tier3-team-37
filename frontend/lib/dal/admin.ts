import "server-only";

import { serverRequest } from "@/lib/api/server-client";
import type {
  AdminAccessRequestListResponse,
  AdminAccessRequestRecord,
  AdminAccessRequestResponse,
  AdminClinicianDetail,
  AdminClinicianSummary,
  AdminDeskSummary,
  AdminPatientSummary,
  AdminReportRecord,
} from "@/types/admin";

export async function getMyAdminAccessRequest(): Promise<AdminAccessRequestRecord | null> {
  try {
    const response = await serverRequest<AdminAccessRequestResponse>("/api/admin/access-requests/mine");
    return response.data;
  } catch {
    return null;
  }
}

export async function getPendingAdminAccessRequests(): Promise<AdminAccessRequestRecord[]> {
  const response = await serverRequest<AdminAccessRequestListResponse>("/api/admin/access-requests");
  return response.data;
}

export async function getAdminClinicians(): Promise<AdminClinicianSummary[]> {
  const response = await serverRequest<{ data: AdminClinicianSummary[] }>("/api/admin/clinicians");
  return response.data;
}

export async function getAdminClinician(id: string): Promise<AdminClinicianDetail> {
  const response = await serverRequest<{ data: AdminClinicianDetail }>(`/api/admin/clinicians/${id}`);
  return response.data;
}

export async function getAdminDeskSummary(): Promise<AdminDeskSummary> {
  const response = await serverRequest<{ data: AdminDeskSummary }>("/api/admin/summary");
  return response.data;
}

export async function getAdminPatients(): Promise<AdminPatientSummary[]> {
  const response = await serverRequest<{ data: AdminPatientSummary[] }>("/api/admin/patients");
  return response.data;
}

export async function getAdminReports(): Promise<AdminReportRecord[]> {
  const response = await serverRequest<{ data: AdminReportRecord[] }>("/api/admin/reports");
  return response.data;
}
