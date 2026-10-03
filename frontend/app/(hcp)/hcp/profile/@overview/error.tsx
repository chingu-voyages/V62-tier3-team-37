"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/hcp/profile/shared";

export default function OverviewError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="overview" error={error} retry={retry} />;
}
