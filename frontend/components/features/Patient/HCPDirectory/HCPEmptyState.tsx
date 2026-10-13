"use client";

import { RotateCcw, Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

type HCPEmptyStateProps = {
  variant: "no-data" | "no-results";
  onClearFilters?: () => void;
};

export function HCPEmptyState({ variant, onClearFilters }: HCPEmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl bg-accent/40 px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_theme(colors.primary/6)_0%,_transparent_70%)]"
      />

      <div className="relative mb-6 flex size-16 items-center justify-center rounded-full bg-accent">
        {variant === "no-data" ? (
          <Stethoscope className="size-8 text-primary/60" />
        ) : (
          <Search className="size-8 text-primary/60" />
        )}
      </div>

      <h2 className="type-h2 text-foreground">
        {variant === "no-data"
          ? "Find your healthcare professional"
          : "No doctors match your filters"}
      </h2>

      <p className="mt-2 max-w-md type-body text-muted-foreground">
        {variant === "no-data"
          ? "Your doctor directory is ready. Once healthcare professionals are available, you'll be able to search by specialty, location, insurance, and more."
          : "Try adjusting your search criteria or clearing all filters to see available healthcare professionals."}
      </p>

      {variant === "no-results" && onClearFilters && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onClearFilters}>
          <RotateCcw className="mr-1.5 size-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
