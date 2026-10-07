import { apiRequest } from "@/lib/api/client";
import type { HCP, HCPFilters } from "@/types/hcp-directory";

const HCPS_ENDPOINT = "/api/patient/hcps";

export type HcpsPage = {
  hcps: HCP[];
  currentPage: number;
  totalPages: number;
  total: number;
};

// Laravel's ResourceCollection wraps the paginator as { data, links, meta }.
type HcpsResponse = {
  data: ApiHcp[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

type ApiHcp = {
  id: number | string;
  name?: string;
  profile_photo?: string;
  specialty?: string;
  sub_specialty?: string;
  years_of_experience?: number;
  workplace_name?: string;
  workplace_address?: string;
  city?: string;
  area?: string;
  fees?: number;
  currency?: string;
  waiting_time?: string;
  rating?: number;
  review_count?: number;
  insurance_accepted?: string[];
};

export function fetchHcps(filters: HCPFilters, page: number): Promise<HcpsPage> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.search) params.set("search", filters.search);
  if (filters.specialty) params.set("specialty", filters.specialty);
  if (filters.city) params.set("city", filters.city);
  if (filters.area) params.set("area", filters.area);
  if (filters.insurance) params.set("insurance", filters.insurance);

  return apiRequest<HcpsResponse>(`${HCPS_ENDPOINT}?${params.toString()}`).then((response) => ({
    hcps: response.data.map(mapApiHcp),
    currentPage: response.meta.current_page,
    totalPages: response.meta.last_page,
    total: response.meta.total,
  }));
}

function mapApiHcp(api: ApiHcp): HCP {
  return {
    id: String(api.id),
    avatar: api.profile_photo,
    fullName: api.name ?? "",
    title: api.specialty ?? "",
    verified: true,
    specialties: api.specialty ? [api.specialty] : [],
    city: api.city,
    area: api.area,
    subSpecialty: api.sub_specialty,
    workplaceName: api.workplace_name,
    workplaceAddress: api.workplace_address,
    yearsOfExperience: api.years_of_experience,
    fees: api.fees,
    currency: api.currency,
    waitingTime: api.waiting_time,
    rating: api.rating,
    reviewCount: api.review_count,
    insuranceAccepted: api.insurance_accepted,
  };
}
