import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";
import type {
  ProfileVerificationRequirementKey,
  ProfileVerificationState,
} from "@/types/hcp-profile";

export const VERIFICATION_REQUIREMENT_KEYS: ProfileVerificationRequirementKey[] = [
  "identity",
  "professional_license",
  "degree_certifications",
  "credential_documents",
  "kyc_liveness",
];

export const VERIFICATION_REQUIREMENT_LABELS: Record<ProfileVerificationRequirementKey, string> = {
  identity: "Identity Verification",
  professional_license: "Professional License",
  degree_certifications: "Degree / Certifications",
  credential_documents: "Credential Documents",
  kyc_liveness: "KYC (Liveness Check)",
};

type VerificationStatePresentation = {
  label: string;
  icon: LucideIcon;
  className: string;
};

export const VERIFICATION_STATE_PRESENTATION: Record<
  ProfileVerificationState,
  VerificationStatePresentation
> = {
  VERIFIED: { label: "Verified", icon: CircleCheck, className: "text-primary" },
  IN_PROGRESS: { label: "In Progress", icon: CircleDashed, className: "text-primary/70" },
  PENDING: { label: "Pending", icon: Clock, className: "text-muted-foreground" },
  NEEDS_MORE_INFORMATION: {
    label: "Needs More Information",
    icon: TriangleAlert,
    className: "text-amber-600",
  },
  REJECTED: { label: "Rejected", icon: CircleAlert, className: "text-destructive" },
};
