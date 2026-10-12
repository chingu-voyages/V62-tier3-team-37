import { apiRequest, getApiErrorMessage } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type VisitStatus =
  | "BOOKED"
  | "ARRIVED"
  | "NO_SHOW"
  | "POSTPONED"
  | "COMPLETED"
  | "CANCELLED";

export type VisitResult = {
  id: number;
  title: string | null;
  file_name: string;
};

export type Visit = {
  id: number;
  status: VisitStatus;
  date: string;
  time: string;
  reason: string | null;
  summary: string | null;
  follow_up_of_id: number | null;
  clinician: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    location: string;
  };
  patient: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  results: VisitResult[];
};

export type DirectoryClinician = {
  id: number;
  full_name: string;
  gender: "MALE" | "FEMALE" | null;
  specialty: string | null;
  specialty_label: string | null;
  years_of_experience: number | null;
  city: string | null;
  workplace_name: string | null;
  workplace_address: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  clinic_photo_url: string | null;
  open_days: number[];
};

export type MessageThread = {
  user_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  preview: string | null;
  sent_at: string | null;
  first?: ThreadVisit | null;
  next?: ThreadVisit | null;
};

export type ThreadVisit = {
  id: number;
  date: string;
  time: string;
  reason: string | null;
  status: VisitStatus;
  summary: string | null;
  created_at: string | null;
  results: VisitResult[];
};

export type ThreadDetail = {
  user: { id: number; name: string; email: string | null; phone: string | null };
  visits: ThreadVisit[];
  messages: ChatMessage[];
};

export type ChatMessage = {
  id: number;
  body: string;
  mine: boolean;
  sent_at: string | null;
};

export function listDirectory(filters?: {
  search?: string;
  city?: string;
  area?: string;
  specialty?: string;
}): Promise<{ data: DirectoryClinician[] }> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.city) params.set("city", filters.city);
  if (filters?.area) params.set("area", filters.area);
  if (filters?.specialty) params.set("specialty", filters.specialty);
  const query = params.toString();
  return apiRequest(`/api/patient/directory${query ? `?${query}` : ""}`);
}

export function listDirectoryPlaces(): Promise<{ data: { cities: string[]; areas: string[] } }> {
  return apiRequest("/api/patient/directory/places");
}

export function clinicianSlots(clinicianId: string): Promise<{ data: Record<string, string[]> }> {
  return apiRequest(`/api/patient/clinicians/${clinicianId}/slots`);
}

export function bookVisit(input: {
  clinicianId: number;
  date: string;
  time: string;
  reason?: string;
}): Promise<{ data: Visit }> {
  return apiRequest("/api/patient/appointments", {
    method: "POST",
    body: {
      clinician_id: input.clinicianId,
      date: input.date,
      time: input.time.slice(0, 5),
      reason: input.reason ?? null,
    },
  });
}

export function listPatientVisits(): Promise<{ data: Visit[] }> {
  return apiRequest("/api/patient/appointments");
}

export function postponePatientVisit(id: number, date: string, time: string): Promise<{ data: Visit }> {
  return apiRequest(`/api/patient/appointments/${id}/postpone`, {
    method: "POST",
    body: { date, time: time.slice(0, 5) },
  });
}

export function cancelPatientVisit(id: number): Promise<{ data: Visit }> {
  return apiRequest(`/api/patient/appointments/${id}/cancel`, { method: "POST" });
}

export function listClinicianVisits(): Promise<{ data: Visit[] }> {
  return apiRequest("/api/hcp/appointments");
}

export function listConnectedPatients(): Promise<{ data: { id: number; name: string; email: string | null }[] }> {
  return apiRequest("/api/hcp/patients");
}

export function setVisitStatus(
  id: number,
  status: "ARRIVED" | "NO_SHOW" | "COMPLETED" | "BOOKED",
): Promise<{ data: Visit }> {
  return apiRequest(`/api/hcp/appointments/${id}/status`, { method: "POST", body: { status } });
}

export function postponeClinicianVisit(id: number, date: string, time: string): Promise<{ data: Visit }> {
  return apiRequest(`/api/hcp/appointments/${id}/postpone`, {
    method: "POST",
    body: { date, time: time.slice(0, 5) },
  });
}

export function saveVisitSummary(id: number, summary: string): Promise<{ data: Visit }> {
  return apiRequest(`/api/hcp/appointments/${id}/summary`, { method: "POST", body: { summary } });
}

export function uploadVisitResult(id: number, file: File, title: string): Promise<{ data: Visit }> {
  const body = new FormData();
  body.append("file", file);
  if (title.trim()) body.append("title", title.trim());
  return apiRequest(`/api/hcp/appointments/${id}/results`, { method: "POST", body });
}

export function offerFollowUp(
  id: number,
  date: string,
  time: string,
  reason: string,
): Promise<{ data: Visit }> {
  return apiRequest(`/api/hcp/appointments/${id}/follow-up`, {
    method: "POST",
    body: { date, time: time.slice(0, 5), reason },
  });
}

export function listThreads(): Promise<{ data: MessageThread[] }> {
  return apiRequest("/api/messages");
}

export function readThread(userId: number): Promise<{ data: ThreadDetail }> {
  return apiRequest(`/api/messages/${userId}`);
}

export function sendMessage(recipientId: number, body: string): Promise<{ data: ChatMessage }> {
  return apiRequest("/api/messages", { method: "POST", body: { recipient_id: recipientId, body } });
}

export async function openVisitResult(scope: "patient" | "hcp", visitId: number, documentId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/${scope}/appointments/${visitId}/results/${documentId}`,
    { credentials: "include", headers: { accept: "*/*" } },
  );
  if (!response.ok) {
    throw new Error("That result could not be opened.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export { getApiErrorMessage };
