import { type ApiMessageResponse, apiRequest } from "@/lib/api/client";
import { validateProfilePhoto } from "@/lib/validation/photo";
import type {
  ApiEnvelope,
  ApiHcpProfile,
  ApiHcpProfileResponse,
  ApiProfilePhotoResponse,
  ReplaceAvailabilityInput,
  UpdateHcpProfileInput,
} from "@/types/hcp-profile-api";

const PROFILE_ENDPOINT = "/api/hcp/profile";
const AVAILABILITY_ENDPOINT = "/api/hcp/profile/availability";
const PHOTO_ENDPOINT = "/api/profile/photo";

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

export function uploadHcpProfilePhoto(file: File): Promise<ApiProfilePhotoResponse> {
  const invalid = validateProfilePhoto(file);
  if (invalid) {
    return Promise.reject(new Error(invalid));
  }

  const formData = new FormData();
  formData.append("photo", file);

  return apiRequest<ApiProfilePhotoResponse>(PHOTO_ENDPOINT, {
    method: "POST",
    body: formData,
  });
}

export function deleteHcpProfilePhoto(): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(PHOTO_ENDPOINT, { method: "DELETE" });
}

function pruneUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
