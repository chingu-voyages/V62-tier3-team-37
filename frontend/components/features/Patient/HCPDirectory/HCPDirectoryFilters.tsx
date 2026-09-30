"use client";

import { RotateCcw, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HCPFilters } from "@/types/hcp";

const SPECIALTIES = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Ophthalmology",
  "Psychiatry",
  "Radiology",
  "General Medicine",
];

const CITIES = ["All Cities", "Cairo", "Alexandria", "Giza", "Luxor", "Aswan"];

const AREAS = ["All Areas", "Downtown", "Heliopolis", "Maadi", "Zamalek", "Mohandeseen"];

const INSURANCES = ["All Insurance", "Medicare", "AXA", "Allianz", "Cigna", "BUPA"];

type HCPDirectoryFiltersProps = {
  filters: HCPFilters;
  onApply: (filters: HCPFilters) => void;
};

export function HCPDirectoryFilters({ filters, onApply }: HCPDirectoryFiltersProps) {
  const [draft, setDraft] = useState<HCPFilters>(filters);

  const update = useCallback((key: keyof HCPFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
  }, [draft, onApply]);

  const handleClear = useCallback(() => {
    const cleared: HCPFilters = {};
    setDraft(cleared);
    onApply(cleared);
  }, [onApply]);

  const hasFilters = Object.values(draft).some((v) => v !== undefined && v !== "");

  return (
    <div className="mb-6 rounded-2xl bg-accent/50 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="filter-specialty" className="mb-1 block type-label text-foreground">
            Specialty
          </label>
          <select
            id="filter-specialty"
            value={draft.specialty ?? ""}
            onChange={(e) =>
              update("specialty", e.target.value === "All Specialties" ? "" : e.target.value)
            }
            className="h-11 w-full rounded-md border border-input bg-background px-3.5 type-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s === "All Specialties" ? "" : s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-city" className="mb-1 block type-label text-foreground">
            City
          </label>
          <select
            id="filter-city"
            value={draft.city ?? ""}
            onChange={(e) => update("city", e.target.value === "All Cities" ? "" : e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3.5 type-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CITIES.map((c) => (
              <option key={c} value={c === "All Cities" ? "" : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-area" className="mb-1 block type-label text-foreground">
            Area
          </label>
          <select
            id="filter-area"
            value={draft.area ?? ""}
            onChange={(e) => update("area", e.target.value === "All Areas" ? "" : e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3.5 type-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {AREAS.map((a) => (
              <option key={a} value={a === "All Areas" ? "" : a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-insurance" className="mb-1 block type-label text-foreground">
            Insurance
          </label>
          <select
            id="filter-insurance"
            value={draft.insurance ?? ""}
            onChange={(e) =>
              update("insurance", e.target.value === "All Insurance" ? "" : e.target.value)
            }
            className="h-11 w-full rounded-md border border-input bg-background px-3.5 type-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {INSURANCES.map((i) => (
              <option key={i} value={i === "All Insurance" ? "" : i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-name" className="mb-1 block type-label text-foreground">
            Search by name
          </label>
          <div className="relative">
            <Input
              id="filter-name"
              placeholder="Doctor name..."
              value={draft.search ?? ""}
              onChange={(e) => update("search", e.target.value)}
              className="pr-10"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleApply} size="lg">
          <Search className="mr-2 size-4" />
          Search
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
