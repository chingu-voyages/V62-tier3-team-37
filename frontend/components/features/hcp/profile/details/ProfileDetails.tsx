import { FileText, Globe, Stethoscope } from "lucide-react";
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
    <div className="flex min-w-0 flex-col gap-4">
      <ProfileCard title="Languages" icon={Globe}>
        <PillList values={preferences?.languages} emptyMessage="No languages added yet." />
      </ProfileCard>

      <ProfileCard title="Consultation Type" icon={Stethoscope}>
        <PillList
          values={preferences?.consultationTypes?.map(consultationLabel)}
          emptyMessage="No consultation types configured yet."
        />
      </ProfileCard>

      <ProfileCard
        title="Professional Bio"
        icon={FileText}
        action={<EditDetailsForm values={editableValues} />}
      >
        {preferences?.bio ? (
          <p className="type-body leading-relaxed break-words whitespace-pre-line text-foreground">
            {preferences.bio}
          </p>
        ) : (
          <SectionEmptyState message="No professional bio has been added yet." />
        )}
      </ProfileCard>
    </div>
  );
}
