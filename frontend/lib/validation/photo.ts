import { PROFILE_PHOTO_MAX_BYTES } from "@/types/profile-api";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const PHOTO_TYPE_MESSAGE = "Please upload a JPG, PNG, or WebP image.";
export const PHOTO_SIZE_MESSAGE = "This image is too large. Maximum size is 5MB.";

export function validateProfilePhoto(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const type = file.type.toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(type)) return PHOTO_TYPE_MESSAGE;
  if (!ALLOWED_EXTENSIONS.has(extension)) return PHOTO_TYPE_MESSAGE;
  if (file.size === 0) return "This file is empty.";
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return PHOTO_SIZE_MESSAGE;

  return null;
}

export function formatPhotoSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
