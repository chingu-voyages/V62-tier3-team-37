import { PatientProfilePanel } from "@/components/features/Patient/profile/PatientProfilePanel";
import { getPatientProfile } from "@/lib/dal/patient";

export default async function PatientProfilePage() {
  const profile = await getPatientProfile();

  return <PatientProfilePanel profile={profile} />;
}
