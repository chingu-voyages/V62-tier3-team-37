/**
 * The presentation primitives live in one place, not beside one feature's pages.
 *
 * `ProfileCardSkeleton`, `ProfileEditDialog`, `ProfilePill`, `ProfileSkeleton*`,
 * `ProfileSectionError*` and `SectionEmptyState` were duplicated here and in
 * `features/shared/profile` with identical contents. They are re-exported from the
 * shared copy rather than re-declared, so a change to one reaches every surface
 * that renders a profile.
 */
export {
  EditTrigger,
  ProfileCardSkeleton,
  ProfileEditDialog,
  ProfilePill,
  ProfileSectionErrorBoundary,
  ProfileSkeleton,
  ProfileSkeletonCircle,
  ProfileSkeletonLines,
  SectionEmptyState,
  skeletonKeys,
} from "@/components/features/shared/profile";
export { EditAvailabilityForm } from "./EditAvailabilityForm";
export { EditDetailsForm } from "./EditDetailsForm";
export { EditProfileForm } from "./EditProfileForm";
export { PROFILE_CARD_SHELL_CLASS, ProfileCard } from "./ProfileCard";
export { hasProfileField, ProfileFieldRow } from "./ProfileFieldRow";
export { ProfilePhotoControl } from "./ProfilePhotoControl";
export { StatusBadge } from "./StatusBadge";
export {
  VERIFICATION_REQUIREMENT_KEYS,
  VERIFICATION_REQUIREMENT_LABELS,
  VERIFICATION_STATE_PRESENTATION,
} from "./verification-status";
