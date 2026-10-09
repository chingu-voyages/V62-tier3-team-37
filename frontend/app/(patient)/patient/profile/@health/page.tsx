import { PatientHealthProfile } from "@/components/features/patient/profile/health/PatientHealthProfile";
import { getPatientHealthSection } from "@/lib/dal/patient";

/**
 * Reads only this section's slice. See `lib/dal/patient` for why the shared
 * upstream call is safe to fan out across the slots.
 *
 * Returns both the display model and the raw editable values, so the editor is not
 * seeded by parsing a rendered number back apart.
 */
export default async function HealthPage() {
  const { health, editable } = await getPatientHealthSection();

  return <PatientHealthProfile health={health} editable={editable} />;
}
