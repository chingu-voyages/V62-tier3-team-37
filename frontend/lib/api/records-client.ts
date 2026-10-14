import { apiRequest } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * One clinician's folder of records.
 *
 * A patient never uploads files here: every document on this page was attached by
 * a clinician to a visit they finished, which is why a card is keyed by the
 * clinician rather than by the file.
 */
export type RecordDocument = {
  id: number;
  appointment_id: number;
  title: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_at: string | null;
  appointment_date: string | null;
  /** Server-built so the client never hardcodes the nested route shape. */
  download_url: string;
};

export type MedicalRecord = {
  hcp: {
    id: number;
    full_name: string;
    email: string;
    specialty_label: string | null;
    city: string | null;
    profile_photo_url: string | null;
  };
  visits_count: number;
  documents: RecordDocument[];
};

export function listMedicalRecords(): Promise<{ data: MedicalRecord[] }> {
  return apiRequest("/api/patient/records");
}

/**
 * Fetch a document as a blob.
 *
 * A plain link or `window.open` cannot be used: the endpoint is behind Sanctum's
 * session cookie, so the browser has to send the request and hand back the body.
 * It is returned as a blob and opened from an object URL, which keeps the
 * authenticated request in fetch and avoids a 401 page replacing the tab.
 */
export async function fetchRecordDocument(url: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    credentials: "include",
    headers: { accept: "*/*" },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 403 || response.status === 401
        ? "That file is not available to you."
        : "That file could not be opened.",
    );
  }

  return response.blob();
}

/** Open a document in a new tab. */
export async function openRecordDocument(document: RecordDocument): Promise<void> {
  const blob = await fetchRecordDocument(document.download_url);
  openBlob(blob, document.file_name, "_blank");
}

/** Save a document to disk. */
export async function downloadRecordDocument(document: RecordDocument): Promise<void> {
  const blob = await fetchRecordDocument(document.download_url);
  openBlob(blob, document.file_name, "download");
}

function openBlob(blob: Blob, fileName: string, mode: "_blank" | "download"): void {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.target = mode;
  if (mode === "download") {
    link.download = fileName;
  }
  link.rel = "noopener noreferrer";
  link.click();
  // Revoked on the next tick: revoking synchronously can cancel the download in
  // some browsers before it has read the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
