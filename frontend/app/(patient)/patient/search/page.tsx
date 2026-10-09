import { Suspense } from "react";
import { toBookingPatient } from "@/components/features/patient/Booking/booking-identity";
import { PatientSearch } from "@/components/features/patient/HCPDirectory/PatientSearch";
import { getOptionalUser } from "@/lib/dal/auth";

/**
 * Reads the signed-in patient once, here on the server.
 *
 * `getOptionalUser` is memoised per request, so this reuses the call `AppShell`
 * already made for the navbar rather than adding one - the booking dialog gets real
 * details with no client request and no loading state. The value is a prop rather
 * than a fetch inside the dialog because a dialog that opens onto an empty card and
 * fills itself in tells the patient their own identity is missing.
 */
export default async function PatientDoctorsPage() {
  const patient = toBookingPatient(await getOptionalUser());

  // `useSearchParams` needs a boundary above it to prerender, otherwise Next
  // opts the whole route out of static rendering.
  return (
    <Suspense fallback={null}>
      <PatientSearch patient={patient} />
    </Suspense>
  );
}
