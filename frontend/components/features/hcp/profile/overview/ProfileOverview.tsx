import {
  BadgeCheck,
  Building2,
  CalendarDays,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import type { FC } from "react";

import { ProfilePhotoControl } from "@/components/features/shared/profile";
import { formatYears } from "@/lib/format";
import type { HcpProfileIdentity } from "@/types/hcp-profile";

type ProfileOverviewProps = {
  profile?: HcpProfileIdentity;
  /** Raw names, for the avatar initials when no photo is set. */
  firstName?: string;
  lastName?: string;
};

type DetailItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
};

type DetailCandidate = Omit<DetailItem, "value" | "subValue"> & {
  value?: string;
  subValue?: string;
};

/** Headline and subline, including the empty-profile fallbacks. */
const buildHeading = (profile?: HcpProfileIdentity) => {
  const hasIdentity = Boolean(profile?.fullName || profile?.specialty);

  const fallbackName = hasIdentity ? "Profile" : "No profile details yet";
  const fallbackSubtitle = hasIdentity
    ? "Specialty not provided"
    : "Add your professional details to get started";

  return {
    name: profile?.fullName ?? fallbackName,
    subtitle: profile?.specialty ?? fallbackSubtitle,
  };
};

/**
 * Labelled facts, empty ones dropped.
 *
 * The values arrive display-ready from `lib/dal/hcp-mappers`, which is what
 * formats the birth date already, so nothing here re-parses a formatted string
 * back into a date. Age only appears when the API sends it on its own: with a
 * date of birth present it states the same fact twice.
 */
const buildDetails = (profile?: HcpProfileIdentity): DetailItem[] => {
  if (!profile) return [];

  const candidates: DetailCandidate[] = [
    { id: "date-of-birth", icon: CalendarDays, label: "Date of birth", value: profile.dateOfBirth },
    {
      id: "age",
      icon: CalendarDays,
      label: "Age",
      value: profile.age === undefined ? undefined : formatYears(profile.age),
    },
    { id: "gender", icon: UserRound, label: "Gender", value: profile.gender },
    { id: "phone", icon: Phone, label: "Phone", value: profile.phone },
    { id: "email", icon: Mail, label: "Email", value: profile.email },
    { id: "location", icon: MapPin, label: "Location", value: profile.location },
    {
      id: "workplace",
      icon: Building2,
      label: "Workplace",
      value: profile.workplaceName,
      subValue: profile.workplaceAddress,
    },
  ];

  const items: DetailItem[] = [];
  for (const candidate of candidates) {
    if (candidate.value) items.push({ ...candidate, value: candidate.value });
  }
  return items;
};

const DetailRow: FC<DetailItem> = ({ icon: Icon, label, value, subValue }) => {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 type-helper text-muted-foreground">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 type-body text-pretty break-words text-foreground">{value}</dd>
      {subValue ? (
        <dd className="type-label text-pretty break-words text-muted-foreground">{subValue}</dd>
      ) : null}
    </div>
  );
};

/**
 * HCP "ID badge": a filled Primary Green identity panel beside a white panel of
 * labelled facts.
 *
 * The panel is solid brand green rather than a tinted one. At 80% opacity the
 * white photo controls and the subtitle it carries dropped below a readable
 * contrast; the brand colour at full strength keeps both legible.
 *
 * Layout follows the card's own width (container queries), not the viewport,
 * because the profile page places this card in different columns.
 * - narrow: green panel on top (photo beside name), details below
 * - wide:   green panel left (photo above name), details right
 */
export const ProfileOverview: FC<ProfileOverviewProps> = ({ profile, firstName, lastName }) => {
  const { name, subtitle } = buildHeading(profile);
  const details = buildDetails(profile);

  return (
    <section
      aria-label="Profile overview"
      className="@container overflow-hidden rounded-3xl border border-border bg-card shadow-card"
    >
      <div className="grid @3xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)]">
        {/* Vertically centred once the panels sit side by side: the identity
            block is shorter than the list of facts beside it, and a top-aligned
            block leaves a lopsided gap under the verified chip. */}
        <div className="flex flex-col bg-primary p-6 text-primary-foreground @3xl:justify-center @3xl:p-7">
          <ProfilePhotoControl
            tone="primary"
            photoUrl={profile?.photoUrl}
            firstName={firstName}
            lastName={lastName}
          />

          <div className="mt-5 min-w-0">
            <h2 className="type-h2 text-balance text-primary-foreground">{name}</h2>
            <p className="mt-1 type-body text-pretty text-primary-foreground/80">{subtitle}</p>

            {profile?.isVerified ? (
              <p className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 type-helper font-medium text-accent">
                  <BadgeCheck className="size-3.5 shrink-0" aria-hidden="true" />
                  Verified HCP
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6 @3xl:p-7">
          {details.length > 0 ? (
            // Two columns once the facts panel is wide enough to keep each value
            // on one line, one while it is the full card width.
            <dl className="grid gap-x-8 gap-y-5 @xl:grid-cols-2">
              {details.map((item) => (
                <DetailRow key={item.id} {...item} />
              ))}
            </dl>
          ) : (
            <p className="type-body text-pretty text-muted-foreground">
              No contact or location details to show yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
