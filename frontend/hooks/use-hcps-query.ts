"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchHcpAvailability,
  fetchHcpFilterOptions,
  fetchHcps,
  HCP_PAGE_SIZE,
  type HcpSort,
} from "@/lib/api/patient-hcps-client";
import { hcpKeys } from "@/lib/query-keys";
import { isValidAvailabilityRange } from "@/lib/validation/booking";
import type { HCPFilters } from "@/types/hcp-directory";

/**
 * The directory page as the API resolved it.
 *
 * The query key carries every input that changes the result set, so each
 * filter combination is cached separately and going back to a previous search
 * is instant.
 */
export function useHcpsQuery(
  filters: HCPFilters,
  page: number,
  sort: HcpSort = "best",
  perPage: number = HCP_PAGE_SIZE,
) {
  return useQuery({
    queryKey: hcpKeys.list(filters, sort, page),
    queryFn: () => fetchHcps(filters, page, sort, perPage),
    // Keeps the previous page on screen while the next one loads, so paging
    // does not collapse the list into a skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useHcpFilterOptionsQuery() {
  return useQuery({
    queryKey: hcpKeys.filterOptions(),
    queryFn: fetchHcpFilterOptions,
    // Facets change only when the catalogue does.
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Free slots for one clinician over an inclusive range.
 *
 * The request only fires once all three inputs are usable: a clinician must be
 * chosen and the range must satisfy the endpoint's own limits. Until then there is
 * nothing to fetch, so the query stays disabled rather than issuing a request the
 * API would reject.
 */
export function useHcpAvailabilityQuery(hcpId: number | null, from: string, to: string) {
  const ready = hcpId !== null && isValidAvailabilityRange(from, to);

  return useQuery({
    queryKey: hcpKeys.availability(hcpId ?? 0, from, to),
    queryFn: () => {
      if (hcpId === null) throw new Error("An HCP id is required to load availability.");
      return fetchHcpAvailability(hcpId, from, to);
    },
    enabled: ready,
    // Slots go stale the moment someone else books one, and the backend is the
    // authority on what is free, so a stale answer is worse than a cheap refetch.
    staleTime: 30 * 1000,
  });
}
