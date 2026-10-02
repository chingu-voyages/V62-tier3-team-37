"use client";

import { ProfileSectionError } from "@/components/features/hcp/profile/shared";

export default function OverviewError({ retry }: { retry: () => void }) {
  return (
    <ProfileSectionError message="We couldn't load your profile information." onRetry={retry} />
  );
}
