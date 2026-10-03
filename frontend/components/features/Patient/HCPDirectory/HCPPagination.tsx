"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HCPPagination as HCPPaginationModel } from "@/types/hcp-directory";

type HCPPaginationProps = HCPPaginationModel & {
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

type PageToken = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(current: number, total: number): PageToken[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageToken[] = [1];

  if (current > 3) {
    pages.push("ellipsis-start");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis-end");
  }

  pages.push(total);

  return pages;
}

export function HCPPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: HCPPaginationProps) {
  // `getPageNumbers` is pure and cheap, and the early return stays above any
  // future hook — a `useMemo` here would violate the rules of hooks.
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || disabled}
        aria-label="Previous page"
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-primary",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageNumbers.map((page) =>
        typeof page === "number" ? (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded-full type-label transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              page === currentPage
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent hover:text-primary",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {page}
          </button>
        ) : (
          <span
            key={page}
            className="flex size-9 items-center justify-center type-label text-muted-foreground/50"
          >
            &hellip;
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || disabled}
        aria-label="Next page"
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-primary",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
