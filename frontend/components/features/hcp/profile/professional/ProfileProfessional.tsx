import { Star, UserRound } from "lucide-react";
import type { FC } from "react";

import { EditProfileForm } from "@/components/features/hcp/profile/shared/EditProfileForm";
import type { HcpEditableProfile, HcpProfessionalInformation } from "@/types/hcp-profile";

import {
  hasProfileField,
  ProfileCard,
  ProfileDisclosure,
  ProfileEyebrow,
  ProfileFieldRow,
  SectionEmptyState,
} from "../shared";

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

type Highlight = {
  label: string;
  value: string;
  /** Muted trailing text, e.g. the review count. */
  detail?: string;
  hasStar?: boolean;
};

/** Drop rows with nothing to show, counting the secondary line as content. */
const presentFields = (fields: ProfessionalField[]): ProfessionalField[] => {
  return fields.filter((field) => hasProfileField(field.value, field.subValue));
};

const pluraliseYears = (count: number): string => {
  return `${count} ${count === 1 ? "year" : "years"}`;
};

/** `500 EGP`, or just the amount when the currency is unset. */
const formatFees = (fees?: number, currency?: string): string | undefined => {
  if (fees === undefined) return undefined;
  return currency ? `${fees} ${currency}` : String(fees);
};

/** Blank until there is a review to count. */
const buildRating = (rating?: number, reviewCount?: number): Highlight | undefined => {
  if (!rating || !reviewCount) return undefined;
  return {
    label: "Patient rating",
    value: rating.toFixed(1),
    detail: `(${reviewCount} review${reviewCount === 1 ? "" : "s"})`,
    hasStar: true,
  };
};

/**
 * Everything the card shows, decided once.
 *
 * The four facts patients compare go to the highlights strip and are NOT
 * repeated in the lists below. The rest is grouped by what it means, and split
 * over two tiers:
 *
 * - on screen   highlights plus the practice a patient reads first: what the
 *               provider does, where, and who they are covered for
 * - behind the  who they are off duty (personal details), and the credentials
 *   disclosure verification set on their behalf
 *
 * The personal block repeats the overview card almost fact for fact, so it is the
 * first thing to move out of the way, while the review-gated credentials stay a
 * tap away rather than pushing the practice facts off screen.
 */
const buildModel = (information?: HcpProfessionalInformation) => {
  const highlights: Highlight[] = [];

  if (information?.yearsOfExperience !== undefined) {
    highlights.push({ label: "Experience", value: pluraliseYears(information.yearsOfExperience) });
  }
  const fees = formatFees(information?.fees, information?.currency);
  if (fees) highlights.push({ label: "Consultation fee", value: fees });
  if (information?.waitingTime)
    highlights.push({ label: "Typical wait", value: information.waitingTime });
  // Read-only: an aggregate of patient reviews, so there is no input for it.
  const rating = buildRating(information?.rating, information?.reviewCount);
  if (rating) highlights.push(rating);

  const practice = presentFields([
    { label: "Specialty", value: information?.specialty },
    { label: "Sub-specialty", value: information?.subSpecialty },
    {
      label: "Workplace or clinic",
      value: information?.workplaceName,
      subValue: information?.workplaceAddress,
    },
    { label: "Location", value: information?.location },
    { label: "Area", value: information?.area },
    { label: "Insurance accepted", value: information?.insuranceAccepted?.join(", ") },
  ]);

  const personal = presentFields([
    { label: "Full name", value: information?.fullName },
    { label: "Date of birth", value: information?.dateOfBirth },
    { label: "Gender", value: information?.gender },
    { label: "Phone number", value: information?.phone },
    { label: "Email", value: information?.email },
  ]);

  const credentials = presentFields([
    { label: "Medical license", value: information?.medicalLicenseNumber },
    { label: "Issuing authority", value: information?.licenseIssuingAuthority },
  ]);

  return {
    highlights,
    practice,
    personal,
    credentials,
    hasPrimary: highlights.length + practice.length > 0,
    hasMore: personal.length + credentials.length > 0,
    hasAnyField: highlights.length + practice.length + personal.length + credentials.length > 0,
  };
};

const HighlightStat: FC<Highlight> = ({ label, value, detail, hasStar }) => {
  return (
    <div className="min-w-0">
      <dt className="type-helper text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-x-1 type-body font-medium text-foreground tabular-nums">
        {hasStar ? (
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
        ) : null}
        {value}
        {detail ? <span className="font-normal text-muted-foreground">{detail}</span> : null}
      </dd>
    </div>
  );
};

const FieldGrid: FC<{ fields: ProfessionalField[]; className?: string }> = ({
  fields,
  className,
}) => {
  return (
    <dl className={className}>
      {fields.map((field) => (
        <ProfileFieldRow key={field.label} {...field} />
      ))}
    </dl>
  );
};

type DetailSectionProps = {
  title: string;
  fields: ProfessionalField[];
  /** Why a group cannot be edited here, e.g. a verification-gated field. */
  note?: string;
  className?: string;
};

/** A hairline-topped group, so the card reads as a ledger instead of one long list. */
const DetailSection: FC<DetailSectionProps> = ({ title, fields, note, className }) => {
  return (
    <section className={className}>
      <ProfileEyebrow>{title}</ProfileEyebrow>
      {note ? <p className="mt-1 type-helper text-muted-foreground">{note}</p> : null}
      <FieldGrid fields={fields} className="mt-4 grid gap-x-6 gap-y-4 @xl:grid-cols-2" />
    </section>
  );
};

export const ProfileProfessional: FC<ProfileProfessionalProps> = ({ information, editable }) => {
  const { highlights, practice, personal, credentials, hasPrimary, hasMore, hasAnyField } =
    buildModel(information);

  const primary = (
    <div className="flex flex-col gap-6">
      {highlights.length > 0 ? (
        <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-accent p-4 @xl:grid-cols-4">
          {highlights.map((highlight) => (
            <HighlightStat key={highlight.label} {...highlight} />
          ))}
        </dl>
      ) : null}

      {practice.length > 0 ? (
        <DetailSection
          title="Practice"
          fields={practice}
          // Only when something sits above it: a hairline as the first thing in
          // the card body reads as a stray rule.
          className={highlights.length > 0 ? "border-t border-border pt-5" : undefined}
        />
      ) : null}
    </div>
  );

  const rest = (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-6 @xl:grid-cols-2">
        {personal.length > 0 ? (
          <DetailSection
            title="Personal"
            fields={personal}
            className="border-t border-border pt-5"
          />
        ) : null}
        {credentials.length > 0 ? (
          // Side by side the two eyebrows share one hairline; stacked it
          // separates the groups. Without a neighbour there is nothing to
          // separate, so the rule is dropped rather than doubled up under the
          // disclosure's own.
          <DetailSection
            title="Credentials"
            fields={credentials}
            note="Set during verification."
            className={personal.length > 0 ? "border-t border-border pt-5" : undefined}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <ProfileCard
      title="Professional Information"
      icon={UserRound}
      // Specialty, years of experience and the license fields are set during
      // verification and rejected by the API, so the editor deliberately omits them
      // rather than offering inputs that could only ever 422.
      action={<EditProfileForm values={editable} />}
    >
      {hasAnyField ? (
        // With nothing to show up front the disclosure would be a lone button, so
        // the card opens with every group it has instead.
        hasPrimary && hasMore ? (
          <ProfileDisclosure summary={primary}>{rest}</ProfileDisclosure>
        ) : (
          <div className="flex flex-col gap-6">
            {primary}
            {rest}
          </div>
        )
      ) : (
        <SectionEmptyState message="Professional details haven't been provided yet." />
      )}
    </ProfileCard>
  );
};
