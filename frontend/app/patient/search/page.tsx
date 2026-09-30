import { HCPDirectory } from "@/components/features/Patient/HCPDirectory";
import type { HCP } from "@/types/hcp";

const hcps: HCP[] = [];

export default function PatientDoctorsPage() {
  return (
    <div className="flex min-h-dvh">
      <HCPDirectory hcps={hcps} />
    </div>
  );
}
