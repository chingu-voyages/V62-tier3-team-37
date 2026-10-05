import { create } from "zustand";
import type { Appointment, NewAppointment } from "@/types/appointment";

type AppointmentStore = {
  appointments: Appointment[];
  addAppointment: (input: NewAppointment) => void;
  postponeAppointment: (id: string, date: string, time: string) => void;
  cancelAppointment: (id: string) => void;
};

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: [],
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
