import { apiRequest } from "@/lib/api/client";
import type {
  ApiEnvelope,
  ApiHcpProfile,
  ApiHcpProfileResponse,
  ReplaceAvailabilityInput,
  UpdateHcpProfileInput,
} from "@/types/hcp-profile-api";

const PROFILE_ENDPOINT = "/api/hcp/profile";
const AVAILABILITY_ENDPOINT = "/api/hcp/profile/availability";

export function updateHcpProfile(input: UpdateHcpProfileInput): Promise<ApiHcpProfileResponse> {
  return apiRequest<ApiHcpProfileResponse>(PROFILE_ENDPOINT, {
    method: "PATCH",
    body: pruneUndefined(input),
  });
}

/** Replaces the entire availability schedule. An empty array clears it. */
export function replaceHcpAvailability(
  input: ReplaceAvailabilityInput,
): Promise<ApiEnvelope<ApiHcpProfile>> {
  return apiRequest<ApiEnvelope<ApiHcpProfile>>(AVAILABILITY_ENDPOINT, {
    method: "PUT",
    body: input,
  });
}

export function deleteHcpAvailabilitySlot(slotId: number): Promise<ApiEnvelope<ApiHcpProfile>> {
  return apiRequest<ApiEnvelope<ApiHcpProfile>>(`${AVAILABILITY_ENDPOINT}/${slotId}`, {
    method: "DELETE",
  });
}

function pruneUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
