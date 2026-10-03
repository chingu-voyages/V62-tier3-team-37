import { UserRound } from "lucide-react";
import { EditProfileForm } from "@/components/features/hcp/profile/shared/EditProfileForm";
import { formatCalendarDate } from "@/lib/format";
import type { HcpEditableProfile, HcpProfessionalInformation } from "@/types/hcp-profile";
import { hasProfileField, ProfileCard, ProfileFieldRow, SectionEmptyState } from "../shared";

type ProfileProfessionalProps = {
  information?: HcpProfessionalInformation;
  /** Raw form values for the fields the API accepts. */
  editable: HcpEditableProfile;
};

type ProfessionalField = {
  label: string;
  value?: string;
  subValue?: string;
};

/** Drop rows with nothing to show, counting the secondary line as content. */
function presentFields(fields: ProfessionalField[]): ProfessionalField[] {
  return fields.filter((field) => hasProfileField(field.value, field.subValue));
}

function pluraliseYears(count: number): string {
  return `${count} ${count === 1 ? "year" : "years"}`;
}

export function ProfileProfessional({ information, editable }: ProfileProfessionalProps) {
  const identityFields = presentFields([
    { label: "Full Name", value: information?.fullName },
    { label: "Date of Birth", value: formatCalendarDate(information?.dateOfBirth) },
    { label: "Gender", value: information?.gender },
    { label: "Phone Number", value: information?.phone },
    { label: "Email", value: information?.email },
  ]);

  const practiceFields = presentFields([
    { label: "Specialty", value: information?.specialty },
    { label: "Sub-specialty", value: information?.subSpecialty },
    {
      label: "Years of Experience",
      value:
        information?.yearsOfExperience === undefined
          ? undefined
          : pluraliseYears(information.yearsOfExperience),
    },
    {
      label: "Workplace / Clinic",
      value: information?.workplaceName,
      subValue: information?.workplaceAddress,
    },
    { label: "Location", value: information?.location },
    { label: "Medical License", value: information?.medicalLicenseNumber },
    { label: "Issuing Authority", value: information?.licenseIssuingAuthority },
  ]);

  const hasAnyField = identityFields.length > 0 || practiceFields.length > 0;

  return (
    <ProfileCard
      title="Professional Information"
      icon={UserRound}
      // Specialty, years of experience and the license fields are set during
      // verification and rejected by the API, so the editor deliberately omits them
      // rather than offering inputs that could only ever 422.
      action={<EditProfileForm values={editable} />}
      className="h-full"
    >
      {hasAnyField ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 @lg:grid-cols-2">
          {identityFields.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-4">
              {identityFields.map((field) => (
                <ProfileFieldRow key={field.label} {...field} />
              ))}
            </div>
          ) : null}

          {practiceFields.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-4">
              {practiceFields.map((field) => (
                <ProfileFieldRow key={field.label} {...field} />
              ))}
            </div>
          ) : null}
        </dl>
      ) : (
        <SectionEmptyState message="Professional details haven't been provided yet." />
      )}
    </ProfileCard>
  );
}
