import { UserRound } from "lucide-react";
import type { HcpProfessionalInformation } from "@/types/hcp-profile";
import { ProfileCard, SectionEmptyState, StaticEditButton } from "../shared";

type ProfileProfessionalProps = {
  information?: HcpProfessionalInformation;
};

type ProfessionalField = {
  label: string;
  value?: string;
  subValue?: string;
};

function formatDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function isPresent(field: ProfessionalField) {
  return Boolean(field.value);
}

function Field({ label, value, subValue }: ProfessionalField) {
  return (
    <div className="min-w-0">
      <dt className="type-helper text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 type-body break-words text-foreground">{value}</dd>
      {subValue ? (
        <p className="mt-0.5 type-helper break-words text-muted-foreground">{subValue}</p>
      ) : null}
    </div>
  );
}

export function ProfileProfessional({ information }: ProfileProfessionalProps) {
  const identityFields: ProfessionalField[] = [
    { label: "Full Name", value: information?.fullName },
    { label: "Date of Birth", value: formatDate(information?.dateOfBirth) },
    { label: "Gender", value: information?.gender },
    { label: "Phone Number", value: information?.phone },
    { label: "Email", value: information?.email },
  ].filter(isPresent);

  const practiceFields: ProfessionalField[] = [
    { label: "Specialty", value: information?.specialty },
    { label: "Sub-specialty", value: information?.subSpecialty },
    {
      label: "Years of Experience",
      value:
        information?.yearsOfExperience === undefined
          ? undefined
          : `${information.yearsOfExperience} ${information.yearsOfExperience === 1 ? "year" : "years"}`,
    },
    {
      label: "Workplace / Clinic",
      value: information?.workplaceName,
      subValue: information?.workplaceAddress,
    },
    { label: "Location", value: information?.location },
  ].filter(isPresent);

  const hasAnyField = identityFields.length > 0 || practiceFields.length > 0;

  return (
    <ProfileCard
      title="Professional Information"
      icon={UserRound}
      action={<StaticEditButton label="Edit professional information" />}
      className="h-full"
    >
      {hasAnyField ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 @lg:grid-cols-2">
          {identityFields.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-4">
              {identityFields.map((field) => (
                <Field key={field.label} {...field} />
              ))}
            </div>
          ) : null}

          {practiceFields.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-4">
              {practiceFields.map((field) => (
                <Field key={field.label} {...field} />
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
