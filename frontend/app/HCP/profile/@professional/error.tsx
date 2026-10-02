"use client";

import { ProfileSectionError } from "@/components/features/hcp/profile/shared";

export default function ProfessionalError({ retry }: { retry: () => void }) {
  return (
    <ProfileSectionError message="We couldn't load your professional details." onRetry={retry} />
  );
}
