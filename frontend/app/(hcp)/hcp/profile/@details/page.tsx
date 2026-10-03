import { ProfileDetails } from "@/components/features/hcp/profile/details/ProfileDetails";
import { getHcpProfessionalPreferences } from "@/lib/dal/hcp";

/**
 * Reads only this section's slice. See `lib/dal/hcp` for why the shared
 * upstream call is safe to fan out across the five slots.
 */
export default async function DetailsPage() {
  const preferences = await getHcpProfessionalPreferences();

  return <ProfileDetails preferences={preferences} />;
}
