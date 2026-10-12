export type AdminAccessRequestRecord = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string | null;
  status: string;
  created_at: string | null;
};

export type AdminAccessRequestResponse = {
  data: AdminAccessRequestRecord | null;
};

export type AdminAccessRequestListResponse = {
  data: AdminAccessRequestRecord[];
};

export type AdminClinicianSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  country: string | null;
  status: string;
  created_at: string | null;
  specialty: string | null;
  years_of_experience: number | null;
  medical_license_number: string | null;
  license_issuing_authority: string | null;
  city: string | null;
  workplace_name: string | null;
  verification_status: string | null;
  submitted_at: string | null;
  liveness_status: string | null;
  rejection_reason: string | null;
  reviews_count: number;
  reports_count: number;
};

export type AdminClinicianDetail = AdminClinicianSummary & {
  documents: Array<{ id: number; type: string | null; title: string | null }>;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string | null;
    author: string;
    created_at: string | null;
  }>;
  reports: Array<{
    id: number;
    reason: string;
    details: string | null;
    status: string | null;
    author: string;
    created_at: string | null;
  }>;
};

export type AdminDeskSummary = {
  clinicians_waiting: number;
  reports_open: number;
  access_requests: number;
  patients: number;
};

export type AdminPatientSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string | null;
};

export type AdminReportRecord = {
  id: number;
  clinician_id: number;
  clinician_name: string;
  reason: string;
  details: string | null;
  status: string;
  author: string;
  created_at: string | null;
};
