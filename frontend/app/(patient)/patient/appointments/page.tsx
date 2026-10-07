import { PatientAppointments } from "@/components/features/patient/Appointments/PatientAppointments";
import type { HCP } from "@/types/hcp-directory";

const _hcps: HCP[] = [];

export default function PatientHomePage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <PatientAppointments />
    </div>
  );
}
