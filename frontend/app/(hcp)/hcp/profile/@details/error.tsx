"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/hcp/profile/shared";

export default function DetailsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="details" error={error} retry={retry} />;
}
