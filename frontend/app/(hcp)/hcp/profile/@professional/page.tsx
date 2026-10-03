import { ProfileProfessional } from "@/components/features/hcp/profile/professional/ProfileProfessional";
import { getHcpProfessionalSection } from "@/lib/dal/hcp";

/**
 * Reads only this section's slice. See `lib/dal/hcp` for why the shared
 * upstream call is safe to fan out across the five slots.
 *
 * Returns both the display model and the raw editable values, so the editor is not
 * seeded by parsing a formatted name or date back apart.
 */
export default async function ProfessionalPage() {
  const { information, editable } = await getHcpProfessionalSection();

  return <ProfileProfessional information={information} editable={editable} />;
}
