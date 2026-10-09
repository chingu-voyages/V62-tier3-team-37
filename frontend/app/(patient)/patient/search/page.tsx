import { Suspense } from "react";
import { PatientSearch } from "@/components/features/patient/HCPDirectory/PatientSearch";

export default function PatientDoctorsPage() {
  // `useSearchParams` needs a boundary above it to prerender, otherwise Next
  // opts the whole route out of static rendering.
  return (
    <Suspense fallback={null}>
      <PatientSearch />
    </Suspense>
  );
}
