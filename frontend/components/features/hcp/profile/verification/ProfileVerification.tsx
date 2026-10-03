import { ShieldCheck } from "lucide-react";
import { formatCalendarDate } from "@/lib/format";
import type {
  ProfileVerificationRequirementKey,
  ProfileVerificationState,
  ProfileVerificationSummary,
} from "@/types/hcp-profile";
import {
  ProfileCard,
  SectionEmptyState,
  StatusBadge,
  VERIFICATION_REQUIREMENT_KEYS,
  VERIFICATION_REQUIREMENT_LABELS,
  VERIFICATION_STATE_PRESENTATION,
} from "../shared";

type ProfileVerificationProps = {
  verification?: ProfileVerificationSummary;
};

type ResolvedRequirementRow = {
  key: ProfileVerificationRequirementKey;
  state: ProfileVerificationState;
};

export function ProfileVerification({ verification }: ProfileVerificationProps) {
  const statesByKey = new Map(
    verification?.requirements?.map((item) => [item.key, item.state]) ?? [],
  );
  const rows: ResolvedRequirementRow[] = verification
    ? VERIFICATION_REQUIREMENT_KEYS.flatMap((key) => {
        const state = statesByKey.get(key);
        return state ? [{ key, state }] : [];
      })
    : [];

  const lastVerified = verification?.lastVerifiedAt
    ? formatCalendarDate(verification.lastVerifiedAt)
    : undefined;

  return (
    <ProfileCard
      title="Verification Status"
      icon={ShieldCheck}
      action={verification ? <StatusBadge state={verification.overall} /> : undefined}
    >
      {rows.length === 0 ? (
        <SectionEmptyState message="Verification information isn't available yet." />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border/70">
            {rows.map(({ key, state }) => {
              const { label, icon: Icon, className } = VERIFICATION_STATE_PRESENTATION[state];

              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className={`size-4 shrink-0 ${className}`} aria-hidden="true" />
                    <span className="type-label text-foreground">
                      {VERIFICATION_REQUIREMENT_LABELS[key]}
                    </span>
                  </div>
                  <span className={`shrink-0 type-helper font-medium ${className}`}>{label}</span>
                </li>
              );
            })}
          </ul>

          {lastVerified ? (
            <p className="mt-4 border-t border-border/70 pt-3 type-helper text-muted-foreground">
              Last verified on {lastVerified}
            </p>
          ) : null}
        </>
      )}
    </ProfileCard>
  );
}
