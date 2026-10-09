"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { HCPDirectory } from "@/components/features/patient/HCPDirectory/HCPDirectory";
import { useHcpsQuery } from "@/hooks/use-hcps-query";
import { HCP_PAGE_SIZE, type HcpSort } from "@/lib/api/patient-hcps-client";
import type { HCPFilters } from "@/types/hcp-directory";

import type { BookingPatient } from "../Booking/booking-types";

const SORTS: HcpSort[] = ["best", "name", "rating", "experience", "price"];

const FILTER_KEYS = ["search", "specialty", "city", "area", "insurance"] as const;

type PatientSearchProps = {
  /**
   * The signed-in patient's own details, resolved on the server by the page.
   *
   * A prop rather than a query: the value is already in hand, and the identity card
   * must never render as "not added" just because a dialog has not finished loading.
   */
  patient: BookingPatient;
};

/**
 * Filter inputs, page and sort live in the URL.
 *
 * A result set is then shareable and survives a refresh, and the query key is
 * derived from one source of truth rather than two that can disagree.
 */
export function PatientSearch({ patient }: PatientSearchProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = readFilters(searchParams);
  const page = readPage(searchParams);
  const sort = readSort(searchParams);

  const query = useHcpsQuery(filters, page, sort);

  const navigate = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // `scroll: false` keeps the list in place; a whole-page jump on every
      // filter change is jarring when only the results changed.
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const applyFilters = useCallback(
    (next: HCPFilters) => {
      // Page 4 of the previous result set means nothing against a different
      // one, so any filter change returns to page 1.
      navigate((params) => {
        for (const key of FILTER_KEYS) params.delete(key);
        for (const [key, value] of Object.entries(next)) {
          if (value) params.set(key, value);
        }
        params.delete("page");
      });
    },
    [navigate],
  );

  const changePage = useCallback(
    (next: number) => {
      navigate((params) => params.set("page", String(next)));
    },
    [navigate],
  );

  const changeSort = useCallback(
    (next: string) => {
      navigate((params) => {
        if (next === "best") params.delete("sort");
        else params.set("sort", next);
        params.delete("page");
      });
    },
    [navigate],
  );

  return (
    <div className="flex w-full h-full flex-col gap-25">
      <HCPDirectory
        hcps={query.data?.hcps ?? []}
        patient={patient}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        total={query.data?.total}
        currentPage={query.data?.currentPage ?? page}
        pageSize={HCP_PAGE_SIZE}
        filters={filters}
        sort={sort}
        onFiltersChange={applyFilters}
        onPageChange={changePage}
        onSortChange={changeSort}
      />
    </div>
  );
}

function readFilters(params: URLSearchParams): HCPFilters {
  const filters: HCPFilters = {};

  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }

  return filters;
}

function readPage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readSort(params: URLSearchParams): HcpSort {
  const sort = params.get("sort");
  return SORTS.find((option) => option === sort) ?? "best";
}
