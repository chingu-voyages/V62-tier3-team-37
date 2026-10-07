"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchHcps } from "@/lib/api/patient-hcps-client";
import type { HCPFilters } from "@/types/hcp-directory";

export function useHcpsQuery(filters: HCPFilters, page: number) {
  return useQuery({
    queryKey: ["hcps", filters, page],
    queryFn: () => fetchHcps(filters, page),
    placeholderData: keepPreviousData,
  });
}
