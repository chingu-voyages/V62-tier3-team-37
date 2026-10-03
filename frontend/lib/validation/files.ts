export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

export const DOCUMENT_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

const TYPE_MESSAGE = "Please upload a JPG, PNG, or PDF file.";
const SIZE_MESSAGE = "This file is too large. Maximum size is 10MB.";

/**
 * Client-side pre-flight check for an uploaded document.
 *
 * Both the extension and the MIME type must pass. Accepting either one alone lets
 * a file through on a single attacker-controlled attribute — an `.exe` renamed to
 * `.pdf` still reports `application/pdf`, and a `.jpg` containing HTML reports
 * `text/html`. Requiring both to agree is the strongest check available here.
 *
 * This is a usability gate, not a security control: the server must re-validate
 * type, size and content before storing anything.
 */
export function validateDocumentFile(file: File): string | null {
  const extension = getExtension(file.name);
  const hasAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
  const hasAllowedMimeType = ALLOWED_MIME_TYPES.has(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return TYPE_MESSAGE;
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return SIZE_MESSAGE;
  }

  if (file.size === 0) {
    return "This file is empty.";
  }

  return null;
}

function getExtension(filename: string): string {
  return filename.toLowerCase().split(".").pop() ?? "";
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
  const extension = getExtension(file.name);

  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    return extension.toUpperCase();
  }

  return file.type || "Document";
}
