import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EditDetailsForm } from "@/components/features/hcp/profile/shared/EditDetailsForm";
import {
  ProfileCard,
  ProfileEyebrow,
  ProfilePill,
  SectionEmptyState,
} from "@/components/features/shared/profile";
import type { HcpProfessionalPreferences } from "@/types/hcp-profile";
import { type ApiConsultationType, CONSULTATION_TYPE_LABELS } from "@/types/hcp-profile-api";

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
          <ProfilePill className="type-body" tone={position === 0 ? "accent" : "neutral"}>
            {value}
          </ProfilePill>
        </li>
      ))}
    </ul>
  );
}

/** Show the enum's label where we know it, otherwise pass the value through. */
function consultationLabel(value: string): string {
  return CONSULTATION_TYPE_LABELS[value as ApiConsultationType] ?? value;
}

type PreferenceGroup = {
  id: string;
  title: string;
  content: ReactNode;
};

/**
 * The preferences a patient's search and booking flow reads.
 *
 * Three groups, each separated by a hairline instead of whitespace alone, so a
 * card where only one of them is filled still looks like the same card rather
 * than a half-written one. The subjects are eyebrows, not headings of their own
 * rank: the card title is the only heading this section owns.
 */
export function ProfileDetails({ preferences }: ProfileDetailsProps) {
  const editableValues = {
    bio: preferences?.bio ?? "",
    languages: preferences?.languages ?? [],
    consultationTypes: (preferences?.consultationTypes ?? []) as ApiConsultationType[],
  };

  const groups: PreferenceGroup[] = [
    {
      id: "languages",
      title: "Languages",
      content: (
        <PillList values={preferences?.languages} emptyMessage="No languages configured yet." />
      ),
    },
    {
      id: "consultation-types",
      title: "Consultation types",
      content: (
        <PillList
          values={preferences?.consultationTypes?.map(consultationLabel)}
          emptyMessage="No consultation types configured yet."
        />
      ),
    },
    {
      id: "bio",
      title: "Professional bio",
      content: preferences?.bio ? (
        <p className="type-body leading-relaxed wrap-break-word whitespace-pre-line text-pretty text-foreground">
          {preferences.bio}
        </p>
      ) : (
        <SectionEmptyState message="No professional bio has been added yet." />
      ),
    },
  ];

  return (
    <ProfileCard
      icon={InfoIcon}
      title="Additional Details"
      action={<EditDetailsForm values={editableValues} />}
    >
      <div className="flex flex-col divide-y divide-border [&>section]:pt-5 [&>section:first-child]:pt-0">
        {groups.map((group) => (
          <section key={group.id}>
            <ProfileEyebrow>{group.title}</ProfileEyebrow>
            <div className="mt-3">{group.content}</div>
          </section>
        ))}
      </div>
    </ProfileCard>
  );
}
