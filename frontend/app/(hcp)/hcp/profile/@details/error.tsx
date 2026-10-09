"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function DetailsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="details" error={error} retry={retry} />;
}
