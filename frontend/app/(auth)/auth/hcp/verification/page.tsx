import { HcpVerificationForm } from "@/components/features/hcp/HcpVerificationForm";
import { requireRole } from "@/lib/dal/auth";

/**
 * Step 3 of HCP onboarding. Mirrors `decideRouteAccess`: HCP role, verified email.
 */
export default async function HcpVerificationPage() {
  await requireRole("HCP");

  return <HcpVerificationForm />;
}
