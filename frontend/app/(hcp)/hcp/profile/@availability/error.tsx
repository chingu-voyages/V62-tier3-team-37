"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/hcp/profile/shared";

export default function AvailabilityError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="availability" error={error} retry={retry} />;
}
