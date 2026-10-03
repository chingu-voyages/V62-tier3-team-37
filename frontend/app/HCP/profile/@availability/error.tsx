"use client";

import { ProfileSectionError } from "@/components/features/hcp/profile/shared";

export default function AvailabilityError({ retry }: { retry: () => void }) {
  return <ProfileSectionError message="We couldn't load your availability." onRetry={retry} />;
}
