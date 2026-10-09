/**
 * Role-agnostic wire vocabulary shared by the HCP and patient profile surfaces.
 *
 * Both profiles read and write the same `User` row - the same gender enum, the
 * same photo endpoints - so these definitions live here once instead of being
 * copied into each role's own API type module.
 */

export type ApiGender = "MALE" | "FEMALE";

/** File types the backend accepts for a profile photo. */
export const PROFILE_PHOTO_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" as const;

/** 5 MB, matching `ProfilePhotoRequest`. */
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The envelope every mutating profile endpoint answers with.
 *
 * Shared because both roles' `PATCH` endpoints wrap the updated resource the
 * same way - it is the API's own convention, not an HCP one.
 */
export type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export type ApiProfilePhotoResponse = ApiEnvelope<{
  profile_photo_path: string;
  profile_photo_url: string;
}>;
