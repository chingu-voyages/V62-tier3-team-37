import { apiRequest } from "@/lib/api/client";
import { validateProfilePhoto } from "@/lib/validation/photo";
import type { ApiProfilePhotoResponse } from "@/types/profile-api";

/**
 * Photo upload for any authenticated user.
 *
 * `/api/profile/photo` is not role-scoped - both `HcpProfileResource` and
 * `PatientProfileResource` read the same `users.profile_photo_path` column, and
 * `ProfilePhotoController` writes it for whoever is signed in. So the transport
 * lives here once rather than being copied per role.
 *
 * Upload only. The endpoint also answers `DELETE`, but nothing in the UI can reach
 * it: the control's single destructive action discards an unsaved pick, and a
 * stored photo is replaced rather than deleted. The route itself is untouched.
 */

const PHOTO_ENDPOINT = "/api/profile/photo";

export function uploadProfilePhoto(file: File): Promise<ApiProfilePhotoResponse> {
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
