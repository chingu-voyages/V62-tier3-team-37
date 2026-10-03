import { ProfileOverview } from "@/components/features/hcp/profile/overview/ProfileOverview";
import { getHcpProfileIdentity } from "@/lib/dal/hcp";

/**
 * Reads only this section's slice. See `lib/dal/hcp` for why the shared
 * upstream call is safe to fan out across the five slots.
 */
export default async function OverviewPage() {
  const { identity, firstName, lastName } = await getHcpProfileIdentity();

  return <ProfileOverview profile={identity} firstName={firstName} lastName={lastName} />;
}
