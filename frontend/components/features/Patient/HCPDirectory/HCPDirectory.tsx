"use client";

import { SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HCP, HCPFilters } from "@/types/hcp-directory";
import type { BookingValues } from "./HCPBookingDialog";
import { HCPDirectoryFilters, hasAnyFilter } from "./HCPDirectoryFilters";
import { HCPDirectoryHeader } from "./HCPDirectoryHeader";
import { HCPEmptyState } from "./HCPEmptyState";
import { HCPList } from "./HCPList";
import { HCPPagination } from "./HCPPagination";

type HCPDirectoryProps = {
  hcps: HCP[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    total?: number;
  };
  onFiltersChange?: (filters: HCPFilters) => void;
  onPageChange?: (page: number) => void;
  onBookRequest?: (hcp: HCP, values: BookingValues) => void;
  onViewProfile?: (hcpId: string) => void;
};

export function HCPDirectory({
  hcps,
  pagination,
  onFiltersChange,
  onPageChange,
  onBookRequest,
  onViewProfile,
}: HCPDirectoryProps) {
  const [appliedFilters, setAppliedFilters] = useState<HCPFilters>({});
  const [resetToken, setResetToken] = useState(0);
  const [sort, setSort] = useState("best");

  const sortedHcps = useMemo(() => {
    const list = [...hcps];
    switch (sort) {
      case "name":
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      case "rating":
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "experience":
        return list.sort((a, b) => (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0));
      default:
        return list;
    }
  }, [hcps, sort]);

  const handleApplyFilters = useCallback(
    (filters: HCPFilters) => {
      setAppliedFilters(filters);
      onFiltersChange?.(filters);
    },
    [onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    setAppliedFilters({});
    setResetToken((token) => token + 1);
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const isEmpty = hcps.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <HCPDirectoryHeader />
      <HCPDirectoryFilters
        filters={appliedFilters}
        onApply={handleApplyFilters}
        resetToken={resetToken}
      />

      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center">
          <HCPEmptyState
            variant={hasAnyFilter(appliedFilters) ? "no-results" : "no-data"}
            onClearFilters={hasAnyFilter(appliedFilters) ? handleClearFilters : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-label font-medium text-primary">
              {pagination?.total ?? hcps.length} doctor
              {(pagination?.total ?? hcps.length) !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="type-label text-muted-foreground">Sort by</span>
              <Select value={sort} onValueChange={setSort}>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <HCPList hcps={sortedHcps} onViewProfile={onViewProfile} onBookRequest={onBookRequest} />
          {pagination ? (
            <HCPPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange ?? (() => {})}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
