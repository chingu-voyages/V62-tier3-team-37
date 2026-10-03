"use client";

import { ProfileSectionError } from "@/components/features/hcp/profile/shared";

export default function VerificationError({ retry }: { retry: () => void }) {
  return (
    <ProfileSectionError message="We couldn't load your verification status." onRetry={retry} />
  );
}
