import "server-only";

import { serverRequest } from "@/lib/api/server-client";
import type {
  AdminAccessRequestListResponse,
  AdminAccessRequestRecord,
  AdminAccessRequestResponse,
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
