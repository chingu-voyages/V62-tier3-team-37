import { create } from "zustand";
import type { NewStoreAppointment, StoreAppointment } from "@/types/appointment";

const INITIAL_APPOINTMENTS: StoreAppointment[] = [
  {
    id: "apt-1",
    doctorName: "Dr. Lina Hassan",
    specialty: "Cardiology",
    location: "Maadi, Cairo",
    date: "2026-10-08",
    time: "10:30",
    reason: "Follow-up consultation",
    status: "upcoming",
  },
  {
    id: "apt-2",
    doctorName: "Dr. Omar Farid",
    specialty: "Dermatology",
    location: "Zamalek, Cairo",
    date: "2026-10-15",
    time: "14:00",
    reason: "Skin check",
    status: "upcoming",
  },
  {
    id: "apt-3",
    doctorName: "Dr. Nadia Karim",
    specialty: "General Medicine",
    location: "Heliopolis, Cairo",
    date: "2026-09-12",
    time: "09:00",
    reason: "Annual check-up",
    status: "completed",
  },
];

type AppointmentStore = {
  appointments: StoreAppointment[];
  addAppointment: (input: NewStoreAppointment) => void;
  postponeAppointment: (id: string, date: string, time: string) => void;
  cancelAppointment: (id: string) => void;
};

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: INITIAL_APPOINTMENTS,
  addAppointment: (input) =>
    set((state) => ({
      appointments: [
        {
          ...input,
          id: `apt-${crypto.randomUUID()}`,
          status: "upcoming",
        },
        ...state.appointments,
      ],
    })),
  postponeAppointment: (id, date, time) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, date, time, status: "postponed" } : appointment,
      ),
    })),
  cancelAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status: "cancelled" } : appointment,
      ),
    })),
}));
