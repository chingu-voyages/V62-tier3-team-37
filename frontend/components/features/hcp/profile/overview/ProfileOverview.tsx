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
import { ProfilePhotoControl } from "@/components/features/hcp/profile/shared/ProfilePhotoControl";
import { calculateAge, formatCalendarDate } from "@/lib/format";
import type { HcpProfileIdentity } from "@/types/hcp-profile";
import { ProfilePill } from "../shared";

type ProfileOverviewProps = {
  profile?: HcpProfileIdentity;
  /** Raw names, for the avatar initials when no photo is set. */
  firstName?: string;
  lastName?: string;
};

type MetaItem = {
  key: string;
  icon: LucideIcon;
  label: string;
};

function MetaPill({ icon: Icon, label }: MetaItem) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ProfileOverview({ profile, firstName, lastName }: ProfileOverviewProps) {
  const hasIdentity = Boolean(profile?.fullName || profile?.specialty);

  // Date of birth already implies age. Only fall back to a derived age when the
  // API sends one without a date, so the same fact is not shown twice.
  const dateOfBirth = formatCalendarDate(profile?.dateOfBirth);
  const derivedAge = calculateAge(profile?.dateOfBirth);
  const ageLabel =
    profile?.age !== undefined
      ? `${profile.age} ${profile.age === 1 ? "year" : "years"}`
      : derivedAge !== undefined
        ? `${derivedAge} ${derivedAge === 1 ? "year" : "years"}`
        : undefined;

  const candidates: (Omit<MetaItem, "label"> & { label: string | undefined })[] = profile
    ? [
        { key: "date-of-birth", icon: CalendarDays, label: dateOfBirth },
        { key: "age", icon: CalendarDays, label: dateOfBirth ? undefined : ageLabel },
        { key: "gender", icon: UserRound, label: profile.gender },
        { key: "phone", icon: Phone, label: profile.phone },
        { key: "email", icon: Mail, label: profile.email },
        { key: "location", icon: MapPin, label: profile.location },
        { key: "workplace-name", icon: Building2, label: profile.workplaceName },
        { key: "workplace-address", icon: MapPin, label: profile.workplaceAddress },
      ]
    : [];

  // Narrowing in the filter keeps `label` a plain string downstream, so rendering
  // needs no assertion.
  const metaItems = candidates.filter(
    (item): item is MetaItem => typeof item.label === "string" && item.label.length > 0,
  );

  return (
    <section className="rounded-2xl border border-secondary/20 bg-accent p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <ProfilePhotoControl
          photoUrl={profile?.photoUrl}
          firstName={firstName}
          lastName={lastName}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h2 className="type-h2 text-foreground">
                {profile?.fullName ?? (hasIdentity ? "Profile" : "No profile details yet")}
              </h2>
              <p className="mt-0.5 type-body text-muted-foreground">
                {profile?.specialty ??
                  (hasIdentity
                    ? "Specialty not provided"
                    : "Add your professional details to get started")}
              </p>
            </div>

            {profile?.isVerified ? (
              <ProfilePill tone="accent" className="shrink-0 font-medium">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verified HCP
              </ProfilePill>
            ) : null}
          </div>

          {metaItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-helper text-muted-foreground">
              {metaItems.map((item) => (
                <MetaPill key={item.key} icon={item.icon} label={item.label} />
              ))}
            </div>
          ) : (
            <p className="type-helper text-muted-foreground">
              No contact or location details to show yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
