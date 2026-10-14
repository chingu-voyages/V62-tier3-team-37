"use client";

import { RotateCcw, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { HCPFilters } from "@/types/hcp-directory";

type FilterKey = keyof HCPFilters;

/**
 * Option lists carry their own "all" sentinel, so the handler and the rendered
 * option can never disagree about which value means "no filter".
 */
type FilterOptions = {
  key: FilterKey;
  id: string;
  label: string;
  allLabel: string;
  options: readonly string[];
};

const FILTER_OPTIONS: readonly FilterOptions[] = [
  {
    key: "specialty",
    id: "filter-specialty",
    label: "Specialty",
    allLabel: "All Specialties",
    options: [
      "Cardiology",
      "Dermatology",
      "Neurology",
      "Pediatrics",
      "Orthopedics",
      "Ophthalmology",
      "Psychiatry",
      "Radiology",
      "General Medicine",
    ],
  },
  {
    key: "city",
    id: "filter-city",
    label: "City",
    allLabel: "All Cities",
    options: ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan"],
  },
  {
    key: "area",
    id: "filter-area",
    label: "Area",
    allLabel: "All Areas",
    options: ["Downtown", "Heliopolis", "Maadi", "Zamalek", "Mohandeseen"],
  },
  {
    key: "insurance",
    id: "filter-insurance",
    label: "Insurance",
    allLabel: "All Insurance",
    options: ["Medicare", "AXA", "Allianz", "Cigna", "BUPA"],
  },
];

const ALL_FILTER_KEYS = FILTER_OPTIONS.map((option) => option.key);

/** Whether any filter is set. Shared with the directory, which needs the same answer. */
export function hasAnyFilter(filters: HCPFilters): boolean {
  return ALL_FILTER_KEYS.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== "";
  });
}

type HCPDirectoryFiltersProps = {
  filters: HCPFilters;
  onApply: (filters: HCPFilters) => void;
  /**
   * Bumped by the parent whenever the applied filters change from outside this
   * component (the empty state's "Clear filters"). Without it the draft below
   * went stale and the inputs kept showing a filter that was no longer applied.
   */
  resetToken?: number;
};

export function HCPDirectoryFilters({ filters, onApply, resetToken }: HCPDirectoryFiltersProps) {
  // Keyed on the parent's applied filters so an external reset re-seeds the
  // draft. Previously `useState(filters)` captured the prop once, forever, and the
  // "Clear filters" button in the empty state left the inputs showing the old
  // selection while the applied filter was already empty.
  const [draft, setDraft] = useState<HCPFilters>(filters);
  const [seenToken, setSeenToken] = useState(resetToken);

  if (resetToken !== undefined && resetToken !== seenToken) {
    setSeenToken(resetToken);
    setDraft(filters);
  }

  const update = useCallback((key: FilterKey, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value || undefined }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
  }, [draft, onApply]);

  const handleClear = useCallback(() => {
    const cleared: HCPFilters = {};
    setDraft(cleared);
    onApply(cleared);
  }, [onApply]);

  return (
    <div className="mb-6 rounded-2xl bg-accent/50 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FILTER_OPTIONS.map((option) => (
          <div key={option.key}>
            <Label htmlFor={option.id} className="mb-1">
              {option.label}
            </Label>
            {/* Radix-backed Select: keyboard navigation, combobox semantics and a
                hidden native select for form submission. The four hand-rolled
                <select> elements this replaced shipped none of that. */}
            <Select
              value={draft[option.key] ?? ""}
              onValueChange={(value) => update(option.key, value)}
            >
              <SelectTrigger id={option.id}>
                <SelectValue placeholder={option.allLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{option.allLabel}</SelectItem>
                {option.options.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div>
          <TextField
            id="filter-name"
            name="search"
            label="Search by name"
            placeholder="Doctor name..."
            value={draft.search ?? ""}
            onChange={(value) => update("search", value)}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={handleApply} size="lg">
          <Search className="mr-2 size-4" aria-hidden="true" />
          Search
        </Button>
        {hasAnyFilter(draft) ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
