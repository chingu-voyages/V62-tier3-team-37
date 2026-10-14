export type HCP = {
  id: string;
  avatar?: string;
  fullName: string;
  title: string;
  verified?: boolean;
  specialties: string[];
  city?: string;
  area?: string;
  nextAvailable?: string;
  subSpecialty?: string;
  workplaceName?: string;
  workplaceAddress?: string;
  yearsOfExperience?: number;
  fees?: number;
  currency?: string;
  waitingTime?: string;
  rating?: number;
  reviewCount?: number;
  insuranceAccepted?: string[];
};

export type HCPFilters = {
  specialty?: string;
  city?: string;
  area?: string;
  insurance?: string;
  search?: string;
};

/**
 * Paging state as the directory API reports it.
 *
 * `total` is the hit count for the whole query, not the page; the pager itself only
 * needs the first two, so `Pagination` declares its own props rather than spreading
 * this type - a control that has no business knowing about a result count should not
 * receive it.
 */
export type HCPPagination = {
  currentPage: number;
  totalPages: number;
  total?: number;
};

export type PatientNavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
};

export type HcpVerificationStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "SUBMITTED";

export type HcpOnboardingResponse = {
  message: string;
  data: {
    verification_status: HcpVerificationStatus;
    submitted_at: string;
  };
};

export type HcpApiValidationErrors = Record<string, string[]>;
