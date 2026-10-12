import { apiRequest } from "@/lib/api/client";
import type { AdminAccessRequestRecord } from "@/types/admin";

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
