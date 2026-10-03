export type AppointmentStatus = "upcoming" | "postponed" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  doctorName: string;
  specialty: string;
  location: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
};

export type NewAppointment = Omit<Appointment, "id" | "status">;
