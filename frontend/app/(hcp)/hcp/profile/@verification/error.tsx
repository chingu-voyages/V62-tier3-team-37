"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function VerificationError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="verification" error={error} retry={retry} />;
}
