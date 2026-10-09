"use client";

import { ProfileSectionErrorBoundary } from "@/components/features/shared/profile";

export default function ProfessionalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ProfileSectionErrorBoundary section="professional" error={error} retry={retry} />;
}
