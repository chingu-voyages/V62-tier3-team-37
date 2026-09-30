export type HCP = {
  id: string;
  avatar?: string;
  fullName: string;
  title: string;
  verified?: boolean;
  specialties: string[];
  city?: string;
  area?: string;
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
