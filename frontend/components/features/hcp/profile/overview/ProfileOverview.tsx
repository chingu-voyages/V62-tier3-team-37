import { ClinicPhotoControl } from "@/components/features/hcp/profile/shared/ClinicPhotoControl";
import { ProfilePhotoControl } from "@/components/features/hcp/profile/shared/ProfilePhotoControl";
import type { HcpProfileIdentity, ProfileRequestDecision } from "@/types/hcp-profile";
import { ProfileFieldRow } from "../shared";

type ProfileOverviewProps = {
  profile?: HcpProfileIdentity;
  /** Raw names, for the avatar initials when no photo is set. */
  firstName?: string;
  lastName?: string;
  decision?: ProfileRequestDecision;
  decisionReason?: string;
};

type ContactItem = {
  label: string;
  value?: string;
};

export function ProfileOverview({
  profile,
  firstName,
  lastName,
  decision = "none",
  decisionReason,
}: ProfileOverviewProps) {
  const born =
    profile?.dateOfBirth ??
    (profile?.age !== undefined
      ? `${profile.age} ${profile.age === 1 ? "year" : "years"}`
      : undefined);

  const place = [profile?.workplaceAddress, profile?.location].filter(Boolean).join(", ");
  const practice = [profile?.workplaceName, place].filter(Boolean).join(" · ");

  const contact: ContactItem[] = [
    { label: "Phone", value: profile?.phone },
    { label: "Email", value: profile?.email },
    { label: "Date of birth", value: born },
    { label: "Gender", value: profile?.gender },
  ].filter((item): item is ContactItem & { value: string } => Boolean(item.value));

  return (
    <div className="flex flex-col gap-4">
      <RequestOutcome decision={decision} reason={decisionReason} />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProfilePhotoControl
            photoUrl={profile?.photoUrl}
            firstName={firstName}
            lastName={lastName}
          />

          <div className="min-w-0 flex-1">
            <h1 className="type-h1 text-foreground">{profile?.fullName ?? "Your profile"}</h1>
            {profile?.specialty ? (
              <p className="mt-1 type-body text-primary">{profile.specialty}</p>
            ) : (
              <p className="mt-1 type-body text-muted-foreground">
                Add your specialty so patients know what you practice.
              </p>
            )}
            {practice ? <p className="mt-1 type-body text-muted-foreground">{practice}</p> : null}
          </div>
        </div>

        {contact.length > 0 ? (
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {contact.map((item) => (
              <ProfileFieldRow key={item.label} label={item.label} value={item.value} />
            ))}
          </dl>
        ) : null}

        <ClinicPhotoControl photoUrl={profile?.clinicPhotoUrl} />
      </section>
    </div>
  );
}

function RequestOutcome({ decision, reason }: { decision: ProfileRequestDecision; reason?: string }) {
  if (decision === "none") return null;

  const accepted = decision === "accepted";
  const declined = decision === "declined";

  return (
    <section
      className={
        declined
          ? "rounded-2xl bg-destructive/10 px-4 py-4 ring-1 ring-destructive/20"
          : "rounded-2xl bg-accent px-4 py-4 ring-1 ring-secondary/25"
      }
    >
      <p className={declined ? "type-h4 text-destructive" : "type-h4 text-primary"}>
        {accepted ? "You're accepted" : declined ? "Your request was declined" : "Under review"}
      </p>
      <p className="mt-1 type-body text-foreground">
        {accepted
          ? "Patients can find you and book from the hours you set."
          : declined
            ? reason || "An admin declined this request."
            : "An admin is checking the details you sent. Patients can find you after it is accepted."}
      </p>
    </section>
  );
}
