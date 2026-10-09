import { PatientAllergies } from "@/components/features/patient/profile/allergies/PatientAllergies";
import { getPatientAllergies } from "@/lib/dal/patient";

/**
 * Reads only this section's slice. See `lib/dal/patient` for why the shared
 * upstream call is safe to fan out across the slots.
 */
export default async function AllergiesPage() {
  const { allergies } = await getPatientAllergies();

  return <PatientAllergies allergies={allergies} />;
}
