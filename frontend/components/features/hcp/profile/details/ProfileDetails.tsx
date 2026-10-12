import { Stethoscope } from "lucide-react";
import { EditDetailsForm } from "@/components/features/hcp/profile/shared/EditDetailsForm";
import type { HcpProfessionalPreferences } from "@/types/hcp-profile";
import type { ApiConsultationType } from "@/types/hcp-profile-api";
import { ProfileCard, ProfilePill, SectionEmptyState } from "../shared";

type ProfileDetailsProps = {
  preferences?: HcpProfessionalPreferences;
};

function PillList({ values, emptyMessage }: { values?: string[]; emptyMessage: string }) {
  // De-duplicate: the list is keyed by value, so a repeated entry produced a
  // duplicate React key and could make React reuse the wrong DOM node.
  const uniqueValues = values ? Array.from(new Set(values)) : undefined;

  if (!uniqueValues || uniqueValues.length === 0) {
    return <SectionEmptyState message={emptyMessage} />;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {uniqueValues.map((value, position) => (
        <li key={value}>
          <ProfilePill tone={position === 0 ? "accent" : "neutral"}>{value}</ProfilePill>
        </li>
      ))}
    </ul>
  );
}

const CONSULTATION_LABELS: Record<ApiConsultationType, string> = {
  IN_PERSON: "In person",
  VIDEO: "Video call",
  PHONE: "Phone call",
};

/** Show the enum's label where we know it, otherwise pass the value through. */
function consultationLabel(value: string): string {
  return CONSULTATION_LABELS[value as ApiConsultationType] ?? value;
}

export function ProfileDetails({ preferences }: ProfileDetailsProps) {
  const editableValues = {
    bio: preferences?.bio ?? "",
    languages: preferences?.languages ?? [],
    consultationTypes: (preferences?.consultationTypes ?? []) as ApiConsultationType[],
  };

  return (
    <ProfileCard
      title="About"
      icon={Stethoscope}
      action={<EditDetailsForm values={editableValues} />}
      className="h-full"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="type-label text-muted-foreground">Languages</h3>
          <div className="mt-2">
            <PillList values={preferences?.languages} emptyMessage="No languages yet." />
          </div>
        </div>

        <div>
          <h3 className="type-label text-muted-foreground">Consultation</h3>
          <div className="mt-2">
            <PillList
              values={preferences?.consultationTypes?.map(consultationLabel)}
              emptyMessage="No consultation types yet."
            />
          </div>
        </div>

        <div>
          <h3 className="type-label text-muted-foreground">Bio</h3>
          {preferences?.bio ? (
            <p className="mt-2 type-body leading-relaxed break-words whitespace-pre-line text-foreground">
              {preferences.bio}
            </p>
          ) : (
            <SectionEmptyState message="Add a short bio patients can read." className="mt-2" />
          )}
        </div>
      </div>
    </ProfileCard>
  );
}
