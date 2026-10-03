import { FileText, Globe, Stethoscope } from "lucide-react";
import type { HcpProfessionalPreferences } from "@/types/hcp-profile";
import { ProfileCard, ProfilePill, SectionEmptyState, StaticEditButton } from "../shared";

type ProfileDetailsProps = {
  preferences?: HcpProfessionalPreferences;
};

function PillList({ values, emptyMessage }: { values?: string[]; emptyMessage: string }) {
  if (!values || values.length === 0) {
    return <SectionEmptyState message={emptyMessage} />;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {values.map((value, position) => (
        <li key={value}>
          <ProfilePill tone={position === 0 ? "accent" : "neutral"}>{value}</ProfilePill>
        </li>
      ))}
    </ul>
  );
}

export function ProfileDetails({ preferences }: ProfileDetailsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ProfileCard title="Languages" icon={Globe}>
        <PillList values={preferences?.languages} emptyMessage="No languages added yet." />
      </ProfileCard>

      <ProfileCard title="Consultation Type" icon={Stethoscope}>
        <PillList
          values={preferences?.consultationTypes}
          emptyMessage="No consultation types configured yet."
        />
      </ProfileCard>

      <ProfileCard
        title="Professional Bio"
        icon={FileText}
        action={<StaticEditButton label="Edit professional bio" />}
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
