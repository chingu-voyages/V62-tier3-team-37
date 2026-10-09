"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function AvailabilityError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="availability" error={error} retry={retry} />;
}
