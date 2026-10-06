"use client";

import { useCallback, useState } from "react";
import type { HCP, HCPFilters } from "@/types/hcp-directory";
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
  };
  onFiltersChange?: (filters: HCPFilters) => void;
  onPageChange?: (page: number) => void;
  onBook?: (hcpId: string) => void;
  onFavorite?: (hcpId: string) => void;
};

export function HCPDirectory({
  hcps,
  pagination,
  onFiltersChange,
  onPageChange,
  onBook,
  onFavorite,
}: HCPDirectoryProps) {
  const [appliedFilters, setAppliedFilters] = useState<HCPFilters>({});
  const [resetToken, setResetToken] = useState(0);

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
          <p className="mb-4 type-label text-muted-foreground">
            {hcps.length} doctor{hcps.length !== 1 ? "s" : ""} found
          </p>
          <HCPList hcps={hcps} onBook={onBook} onFavorite={onFavorite} />
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
