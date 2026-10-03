"use client";

import { useEffect } from "react";
import {
  PROFILE_SECTION_ERROR_MESSAGES,
  ProfileSectionError,
  type ProfileSectionErrorMessages,
} from "./ProfileSectionError";

type ProfileSectionErrorBoundaryProps = {
  section: keyof ProfileSectionErrorMessages;
  error: Error & { digest?: string };
  // `retry` is the stable prop as of next@16.3.0; `reset()` is deprecated.
  retry: () => void;
};

/**
 * Client half of the per-section error boundaries.
 *
 * Each `error.tsx` is only this file with a different `section` prop. Centralising
 * it here means the five boundaries also *log* — previously every one of them
 * swallowed the exception with no `console.error` and no report, so a section
 * failing was indistinguishable from a section rendering empty.
 */
export function ProfileSectionErrorBoundary({
  section,
  error,
  retry,
}: ProfileSectionErrorBoundaryProps) {
  useEffect(() => {
    console.error(`Profile section "${section}" failed to load`, error);
  }, [section, error]);

  return (
    <ProfileSectionError
      message={PROFILE_SECTION_ERROR_MESSAGES[section]}
      onRetry={() => retry()}
    />
  );
}
