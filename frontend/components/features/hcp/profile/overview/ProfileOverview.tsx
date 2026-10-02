import { BadgeCheck, Building2, CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HcpProfileIdentity } from "@/types/hcp-profile";

type ProfileOverviewProps = {
  profile?: HcpProfileIdentity;
};

type MetaItemProps = {
  icon: typeof CalendarDays;
  label: string;
};

function MetaItem({ icon: Icon, label }: MetaItemProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function formatDateOfBirth(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function ProfileOverview({ profile }: ProfileOverviewProps) {
  const hasIdentity = Boolean(profile?.fullName || profile?.specialty);
  const metaItems: (MetaItemProps & { key: string })[] = profile
    ? [
        {
          key: "date-of-birth",
          icon: CalendarDays,
          label: formatDateOfBirth(profile.dateOfBirth ?? ""),
        },
        {
          key: "age",
          icon: CalendarDays,
          label: profile.age === undefined ? undefined : `${profile.age} years`,
        },
        { key: "gender", icon: UserRound, label: profile.gender },
        { key: "phone", icon: Phone, label: profile.phone },
        { key: "email", icon: Mail, label: profile.email },
        { key: "location", icon: MapPin, label: profile.location },
        { key: "workplace-name", icon: Building2, label: profile.workplaceName },
        { key: "workplace-address", icon: MapPin, label: profile.workplaceAddress },
      ].filter((item): item is MetaItemProps & { key: string } => Boolean(item.label))
    : [];

  return (
    <section className="rounded-2xl border border-secondary/20 bg-accent p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <Avatar className="size-16 shrink-0 sm:size-20">
          {profile?.photoUrl ? (
            <AvatarImage src={profile.photoUrl} alt={profile.fullName ?? "Profile photo"} />
          ) : null}
          <AvatarFallback className="bg-card text-primary">
            <UserRound className="size-7 sm:size-8" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h2 className="type-h2 text-foreground">
                {profile?.fullName ?? (hasIdentity ? "Profile" : "No profile details yet")}
              </h2>
              {profile?.specialty ? (
                <p className="mt-0.5 type-body text-muted-foreground">{profile.specialty}</p>
              ) : (
                <p className="mt-0.5 type-body text-muted-foreground">
                  {hasIdentity
                    ? "Specialty not provided"
                    : "Add your professional details to get started"}
                </p>
              )}
            </div>

            {profile?.isVerified ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-secondary/30 bg-card px-2 py-1 type-helper font-medium text-primary">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verified HCP
              </span>
            ) : null}
          </div>

          {metaItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-helper text-muted-foreground">
              {metaItems.map((item) => (
                <MetaItem key={item.key} icon={item.icon} label={item.label} />
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
