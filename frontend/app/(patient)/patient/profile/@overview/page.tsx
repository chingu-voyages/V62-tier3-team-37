import { PatientProfileOverview } from "@/components/features/patient/profile/overview/PatientProfileOverview";
import { getPatientProfileOverview } from "@/lib/dal/patient";

/**
 * Reads only this section's slice. See `lib/dal/patient` for why the shared
 * upstream call is safe to fan out across the slots.
 */
export default async function OverviewPage() {
  const { overview, editable, firstName, lastName } = await getPatientProfileOverview();

  return (
    <PatientProfileOverview
      profile={overview}
      firstName={firstName}
      lastName={lastName}
      editable={editable}
    />
  );
}
