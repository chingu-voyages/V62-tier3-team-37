export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

export const DOCUMENT_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export function validateDocumentFile(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const hasAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
  const hasAllowedMimeType = ALLOWED_MIME_TYPES.has(file.type.toLowerCase());

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return "Please upload a JPG, PNG, or PDF file.";
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return "This file is too large. Maximum size is 10MB.";
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const roundedValue =
    value >= 10 || Number.isInteger(value) ? Math.round(value) : Math.round(value * 10) / 10;

  return `${roundedValue} ${units[unitIndex]}`;
}

export function getFileTypeLabel(file: File): string {
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    return extension.toUpperCase();
  }

  return file.type || "Document";
}
