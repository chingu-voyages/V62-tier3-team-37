"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function HealthError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="health" error={error} retry={retry} />;
}
