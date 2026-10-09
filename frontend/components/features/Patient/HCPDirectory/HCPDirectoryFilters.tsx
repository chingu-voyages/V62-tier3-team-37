"use client";

import { type LucideIcon, MapPin, Search, ShieldCheck, Stethoscope } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHcpFilterOptionsQuery } from "@/hooks/use-hcps-query";
import type { HCPFilters } from "@/types/hcp-directory";

type FilterKey = "specialty" | "city" | "area" | "insurance";

const FILTER_ICONS: Record<FilterKey, LucideIcon> = {
  specialty: Stethoscope,
  city: MapPin,
  area: MapPin,
  insurance: ShieldCheck,
};

const FILTER_META: { key: FilterKey; id: string; label: string; allLabel: string }[] = [
  { key: "specialty", id: "filter-specialty", label: "Specialty", allLabel: "All Specialties" },
  { key: "city", id: "filter-city", label: "City", allLabel: "All Cities" },
  { key: "area", id: "filter-area", label: "Area", allLabel: "All Areas" },
  { key: "insurance", id: "filter-insurance", label: "Insurance", allLabel: "All Insurance" },
];

const SEARCH_KEYS = [...FILTER_META.map((meta) => meta.key), "search"] as (keyof HCPFilters)[];

/** Whether any filter is set. Shared with the directory, which needs the same answer. */
export function hasAnyFilter(filters: HCPFilters): boolean {
  return SEARCH_KEYS.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== "";
  });
}

type HCPDirectoryFiltersProps = {
  /** Applied filters. The parent seeds this from the URL. */
  filters: HCPFilters;
  onApply: (filters: HCPFilters) => void;
};

/**
 * Search box plus the four filters.
 *
 * Options come from the API rather than a local list, so the dropdowns only
 * offer values that have at least one eligible doctor behind them.
 *
 * The two halves behave differently on purpose:
 *
 * - **Selects apply immediately.** A dropdown is a decision, not a phrase being
 *   composed, so choosing one should narrow the list at once rather than queue a
 *   second click. The request goes out on `onValueChange`.
 * - **The text box keeps the Search button.** Typing is incremental - every
 *   keystroke would otherwise fire a request - so the field stays a draft until
 *   the button (or Enter) commits it.
 *
 * The parent owns the applied filters and remounts this form when they change,
 * so the draft only needs to seed from props once. Because a select writes through
 * immediately it must not also update the local draft from its stale copy, or the
 * two would disagree about what is applied.
 */
export function HCPDirectoryFilters({ filters, onApply }: HCPDirectoryFiltersProps) {
  const [draft, setDraft] = useState<HCPFilters>(filters);
  const { data: options } = useHcpFilterOptionsQuery();

  const choices: Record<FilterKey, readonly string[]> = {
    specialty: options?.specialties.map((option) => option.value) ?? [],
    city: options?.cities ?? [],
    area: options?.areas ?? [],
    insurance: options?.insurances ?? [],
  };

  /** Text input: holds the value locally until the form is submitted. */
  const updateDraft = useCallback((key: FilterKey | "search", value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value || undefined }));
  }, []);

  /**
   * Dropdown: applies straight away, merged onto the filters already applied.
   *
   * Merging from `filters` rather than from `draft` is what keeps a select from
   * dragging along an uncommitted search phrase: only the dropdown's own key is
   * sent to the API.
   */
  const applyFilter = useCallback(
    (key: FilterKey, value: string) => {
      onApply({ ...filters, [key]: value || undefined });
    },
    [filters, onApply],
  );

  return (
    <div className="mb-6 rounded-2xl bg-accent/50 p-5">
      <form
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="filter-name" className="sr-only">
            Search by name
          </label>
          <Input
            id="filter-name"
            name="search"
            placeholder="Search by name, specialty, or keyword..."
            className="h-11 rounded-xl bg-card pl-10"
            value={draft.search ?? ""}
            onChange={(event) => updateDraft("search", event.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-xl px-6">
          <Search className="mr-2 size-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILTER_META.map((meta) => {
          const Icon = FILTER_ICONS[meta.key];
          const values = choices[meta.key];

          return (
            <Select
              key={meta.key}
              // Reflects what is applied, not the draft, so the trigger shows the
              // request the list was actually filtered by.
              value={filters[meta.key] ?? ""}
              onValueChange={(value) => applyFilter(meta.key, value)}
            >
              <SelectTrigger
                id={meta.id}
                aria-label={meta.label}
                className="h-auto rounded-xl border-input bg-card px-3.5 py-2.5 shadow-none hover:bg-card"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col items-start gap-0.5">
                    <span className="type-helper text-muted-foreground">{meta.label}</span>
                    <span className="type-label font-medium text-foreground">
                      <SelectValue placeholder={meta.allLabel} />
                    </span>
                  </span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{meta.allLabel}</SelectItem>
                {values.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>
    </div>
  );
}
