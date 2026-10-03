import { PatientAppointments } from "@/components/features/Patient/Appointments/PatientAppointments";
import { HCPDirectory } from "@/components/features/Patient/HCPDirectory";
import type { HCP } from "@/types/hcp";

const hcps: HCP[] = [];

export default function PatientHomePage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <PatientAppointments />
      <HCPDirectory hcps={hcps} />
    </div>
  );
}
