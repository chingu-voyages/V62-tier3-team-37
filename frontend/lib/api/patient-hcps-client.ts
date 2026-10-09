import { apiRequest } from "@/lib/api/client";
import type { HcpAvailabilityEnvelope, HcpAvailabilityResponse } from "@/types/appointment";
import type { HCP, HCPFilters } from "@/types/hcp-directory";

const HCPS_ENDPOINT = "/api/patient/hcps";

const FILTER_OPTIONS_ENDPOINT = "/api/patient/hcps/filter-options";

/**
 * Rows per request.
 *
 * Ten matches the API default, so a reload returns the first page and each
 * click on the page controls sends a new request for the next ten.
 */
export const HCP_PAGE_SIZE = 10;

export type HcpSort = "best" | "name" | "rating" | "experience" | "price";

export type HcpsPage = {
  hcps: HCP[];
  currentPage: number;
  totalPages: number;
  total: number;
};

export type HcpFilterOptions = {
  specialties: { value: string; enum: string }[];
  cities: string[];
  areas: string[];
  insurances: string[];
};

// Laravel's ResourceCollection wraps the paginator as { data, links, meta }.
type HcpsResponse = {
  data: ApiHcp[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type ApiHcp = {
  id: number | string;
  name?: string;
  verified?: boolean;
  profile_photo?: string;
  specialty?: string;
  specialty_label?: string;
  years_of_experience?: number;
  sub_specialty?: string;
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

/**
 * One page of the directory.
 *
 * Filtering, sorting and pagination are all resolved by the API: the client
 * only ever holds a single page, so filtering it locally would miss every match
 * that is not on that page.
 */
export function fetchHcps(
  filters: HCPFilters,
  page: number,
  sort: HcpSort = "best",
  perPage: number = HCP_PAGE_SIZE,
): Promise<HcpsPage> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  params.set("sort", sort);

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

/**
 * Dropdown options, derived from the rows the API would actually return.
 *
 * A hard-coded list drifts and eventually offers a city that matches nothing.
 */
export function fetchHcpFilterOptions(): Promise<HcpFilterOptions> {
  return apiRequest<{ data: HcpFilterOptions }>(FILTER_OPTIONS_ENDPOINT).then(
    (response) => response.data,
  );
}

/**
 * Free slots for one clinician over an inclusive `YYYY-MM-DD` range.
 *
 * The backend owns this: slots are never derived from the clinician's weekly
 * hours on the client, because a booked or blocked slot is only knowable there.
 * A date whose `slots` array is empty means "nothing free that day", which is
 * different from the date being absent.
 */
export function fetchHcpAvailability(
  hcpId: number,
  from: string,
  to: string,
): Promise<HcpAvailabilityResponse> {
  const params = new URLSearchParams({ from, to });

  return apiRequest<HcpAvailabilityEnvelope>(
    `${HCPS_ENDPOINT}/${hcpId}/availability?${params.toString()}`,
  ).then((response) => response.data);
}

function mapApiHcp(api: ApiHcp): HCP {
  const specialties = api.specialty ? [api.specialty_label ?? api.specialty] : [];

  return {
    id: String(api.id),
    avatar: api.profile_photo,
    fullName: api.name ?? "",
    title: api.specialty_label ?? api.specialty ?? "",
    verified: api.verified ?? false,
    specialties,
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
