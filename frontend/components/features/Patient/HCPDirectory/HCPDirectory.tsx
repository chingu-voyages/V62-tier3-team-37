"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HcpSort } from "@/lib/api/patient-hcps-client";
import type { HCP, HCPFilters } from "@/types/hcp-directory";
import { HCPDirectoryFilters, hasAnyFilter } from "./HCPDirectoryFilters";
import { HCPDirectoryHeader } from "./HCPDirectoryHeader";
import { HCPEmptyState } from "./HCPEmptyState";
import { HCPList } from "./HCPList";
import { HCPListSkeleton } from "./HCPListSkeleton";
import { HCPPagination } from "./HCPPagination";

type HCPDirectoryProps = {
  /** The current page of results, as resolved by the API. */
  hcps: HCP[];
  /** First load: nothing to show yet. */
  isLoading?: boolean;
  /** A later page or filter is in flight; the current rows stay visible. */
  isFetching?: boolean;
  /** Total matches across all pages. */
  total?: number;
  /** The page currently displayed, as requested. */
  currentPage?: number;
  pageSize?: number;
  filters: HCPFilters;
  sort: HcpSort;
  onFiltersChange?: (filters: HCPFilters) => void;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: string) => void;
  onViewProfile?: (hcpId: string) => void;
};

/**
 * Presentational directory.
 *
 * Every decision about *which* rows are shown has already been made by the API;
 * this component renders the page it is handed and reports intent back up.
 */
export function HCPDirectory({
  hcps,
  isLoading = false,
  isFetching = false,
  total,
  currentPage = 1,
  pageSize = 10,
  filters,
  sort,
  onFiltersChange,
  onPageChange,
  onSortChange,
  onViewProfile,
}: HCPDirectoryProps) {
  const filtered = hasAnyFilter(filters);
  const showSkeleton = isLoading;
  const showEmpty = !showSkeleton && hcps.length === 0;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil((total ?? hcps.length) / pageSize)) : 1;
  const matchCount = total ?? hcps.length;

  return (
    <div className="flex flex-1 flex-col">
      <HCPDirectoryHeader />

      {/*
        Keyed on the applied *search term* only. The form's dropdowns read straight
        from `filters`, so they never need re-seeding; only the text box holds a
        draft, and it has to re-seed when the applied search changes - after a
        submit, or when the URL moves under back/forward navigation.

        Keying on every filter instead would also discard whatever had been typed
        but not yet submitted whenever a dropdown was chosen, which is the one thing
        a patient would notice as a lost keystroke.
      */}
      <HCPDirectoryFilters
        key={filters.search ?? ""}
        filters={filters}
        onApply={onFiltersChange ?? (() => {})}
      />

      {showSkeleton ? (
        <HCPListSkeleton count={Math.min(pageSize, 4)} />
      ) : showEmpty ? (
        <div className="flex flex-1 items-center justify-center">
          <HCPEmptyState
            variant={filtered ? "no-results" : "no-data"}
            onClearFilters={filtered ? () => onFiltersChange?.({}) : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-label font-medium text-primary" aria-live="polite">
              {matchCount} doctor{matchCount !== 1 ? "s" : ""} found
              {isFetching ? <span className="sr-only">, updating</span> : null}
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="type-label text-muted-foreground">Sort by</span>
              <Select value={sort} onValueChange={onSortChange ?? (() => {})}>
                <SelectTrigger
                  aria-label="Sort by"
                  className="h-9 w-40 rounded-lg border-input bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best Match</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="price">Lowest Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <HCPList hcps={hcps} onViewProfile={onViewProfile} />

          {totalPages > 1 ? (
            <HCPPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange ?? (() => {})}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
