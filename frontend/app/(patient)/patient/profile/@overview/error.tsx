"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function OverviewError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="overview" error={error} retry={retry} />;
}
