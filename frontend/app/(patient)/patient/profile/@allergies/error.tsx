"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function AllergiesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="allergies" error={error} retry={retry} />;
}
