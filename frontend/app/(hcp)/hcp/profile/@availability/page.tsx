import { ProfileAvailabilitySection } from "@/components/features/hcp/profile/availability/ProfileAvailabilitySection";
import { getHcpAvailability } from "@/lib/dal/hcp";

/**
 * Reads only this section's slice. See `lib/dal/hcp` for why the shared
 * upstream call is safe to fan out across the five slots.
 */
export default async function AvailabilityPage() {
  const availability = await getHcpAvailability();

  return <ProfileAvailabilitySection availability={availability} />;
}
