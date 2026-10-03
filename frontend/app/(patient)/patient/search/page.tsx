import { HCPDirectory } from "@/components/features/patient/HCPDirectory/HCPDirectory";
import type { HCP } from "@/types/hcp-directory";

const hcps: HCP[] = [];

export default function PatientDoctorsPage() {
  return (
    <div className="flex min-h-dvh">
      <HCPDirectory hcps={hcps} />
    </div>
  );
}
