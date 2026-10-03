import { ProfileVerification } from "@/components/features/hcp/profile/verification/ProfileVerification";
import { getHcpVerificationSummary } from "@/lib/dal/hcp";

/**
 * Reads only this section's slice. See `lib/dal/hcp` for why the shared
 * upstream call is safe to fan out across the five slots.
 */
export default async function VerificationPage() {
  const verification = await getHcpVerificationSummary();

  return <ProfileVerification verification={verification} />;
}
