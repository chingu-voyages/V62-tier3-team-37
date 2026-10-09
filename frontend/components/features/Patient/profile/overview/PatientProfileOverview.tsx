import { CalendarDays, type LucideIcon, MapPin, Phone, UserRound } from "lucide-react";
import type { FC } from "react";

import { ProfileEyebrow, ProfilePhotoControl } from "@/components/features/shared/profile";
import { formatYears } from "@/lib/format";
import type {
  PatientEditableContact,
  PatientProfileOverview as PatientIdentity,
} from "@/types/patient-profile";
import { EditContactForm } from "../shared";

type PatientOverviewProps = {
  profile: PatientIdentity;
  /** Raw names, for the avatar initials when no photo is set. */
  firstName?: string;
  lastName?: string;
  /** Raw contact values, so the editor is seeded from the wire rather than parsed back. */
  editable: PatientEditableContact;
};

type DetailItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  value?: string;
};

/** Headline and subline, including the empty-profile fallbacks. */
const buildHeading = (profile: PatientIdentity) => {
  return {
    name: profile.fullName ?? "Your profile",
    subtitle: profile.email ?? "No email on file",
  };
};

/** Labelled facts, empty ones dropped. */
const buildDetails = (profile: PatientIdentity): DetailItem[] => {
  const candidates: DetailItem[] = [
    { id: "date-of-birth", icon: CalendarDays, label: "Date of birth", value: profile.birthDate },
    {
      id: "age",
      icon: CalendarDays,
      label: "Age",
      value: profile.age === undefined ? undefined : formatYears(profile.age),
    },
    { id: "gender", icon: UserRound, label: "Gender", value: profile.gender },
    { id: "phone", icon: Phone, label: "Phone", value: profile.phone },
    { id: "country", icon: MapPin, label: "Country", value: profile.country },
  ];

  return candidates.filter((item) => Boolean(item.value));
};

const DetailRow: FC<DetailItem> = ({ icon: Icon, label, value }) => (
  <div className="min-w-0">
    <dt className="flex items-center gap-1.5 type-helper text-muted-foreground">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      {label}
    </dt>
    <dd className="mt-1 type-body text-pretty break-words text-foreground">{value}</dd>
  </div>
);

/**
 * The patient's "ID badge": a filled Primary Green identity panel beside a white
 * panel of labelled facts.
 *
 * The same two-panel structure as the HCP overview, because both answer the same
 * question - who is this, and how do I reach them - and only the facts differ. The
 * panels follow the card's own width (container queries) rather than the viewport,
 * since the page places this card in different columns.
 *
 * Email is the subtitle rather than another row: it is the account's own
 * identifier, and a labelled duplicate would add a line without adding a fact.
 */
export const PatientProfileOverview: FC<PatientOverviewProps> = ({
  profile,
  firstName,
  lastName,
  editable,
}) => {
  const { name, subtitle } = buildHeading(profile);
  const details = buildDetails(profile);

  return (
    <section
      aria-label="Profile overview"
      className="@container overflow-hidden rounded-3xl border border-border bg-card shadow-card"
    >
      <div className="grid @3xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)]">
        <div className="flex flex-col bg-primary p-6 text-primary-foreground @3xl:justify-center @3xl:p-7">
          <ProfilePhotoControl
            tone="primary"
            photoUrl={profile.photoUrl}
            firstName={firstName}
            lastName={lastName}
          />

          <div className="mt-5 min-w-0">
            <h2 className="type-h2 text-balance text-primary-foreground">{name}</h2>
            <p className="mt-1 type-body text-pretty text-primary-foreground/80">{subtitle}</p>

            <p className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 type-helper font-medium text-accent">
                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                Patient account
              </span>
            </p>
          </div>
        </div>

        <div className="p-6 @3xl:p-7">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <ProfileEyebrow>Your details</ProfileEyebrow>
            <EditContactForm values={editable} />
          </div>

          {details.length > 0 ? (
            <dl className="mt-4 grid gap-x-8 gap-y-5 @xl:grid-cols-2">
              {details.map((item) => (
                <DetailRow key={item.id} {...item} />
              ))}
            </dl>
          ) : (
            <p className="mt-4 type-body text-pretty text-muted-foreground">
              No details to show yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
