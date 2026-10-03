import { PatientAppointments } from "@/components/features/patient/Appointments/PatientAppointments";
import { HCPDirectory } from "@/components/features/patient/HCPDirectory/HCPDirectory";
import type { HCP } from "@/types/hcp-directory";

const hcps: HCP[] = [];

export default function PatientHomePage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <PatientAppointments />
      <HCPDirectory hcps={hcps} />
    </div>
  );
}
