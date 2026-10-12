export type AppointmentStatus =
  | "upcoming"
  | "postponed"
  | "arrived"
  | "no_show"
  | "completed"
  | "cancelled";

export type Appointment = {
  id: string;
  clinicianId?: number;
  doctorName: string;
  email?: string | null;
  phone?: string | null;
  specialty: string;
  location: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  summary?: string | null;
  results?: { id: number; title: string }[];
};

export type NewAppointment = Omit<Appointment, "id" | "status">;
