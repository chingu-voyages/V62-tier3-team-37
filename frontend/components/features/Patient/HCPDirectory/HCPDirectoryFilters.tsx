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
import type { HCP, HCPFilters } from "@/types/hcp-directory";

const FILTER_ICONS: Record<FilterKey, LucideIcon> = {
  specialty: Stethoscope,
  city: MapPin,
  area: MapPin,
  insurance: ShieldCheck,
  search: Search,
};

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

type DoctorGender = "female" | "male";
type Availability = "today" | "tomorrow";

type LandingDoctor = HCP & {
  gender: DoctorGender;
  yearsOfExperience: number;
  availableOn: readonly Availability[];
};

type LandingFilters = HCPFilters & {
  gender?: DoctorGender;
  maxPrice?: number;
  minExperience?: number;
  availability?: Availability;
};

// const SAMPLE_DOCTORS: LandingDoctor[] = [
//   {
//     id: "dr-lina",
//     fullName: "Dr. Lina Hassan",
//     title: "Consultant cardiologist",
//     verified: true,
//     specialties: ["Cardiology"],
//     city: "Cairo",
//     area: "Maadi",
//     fees: 500,
//     currency: "EGP",
//     waitingTime: "20 min",
//     rating: 4.8,
//     reviewCount: 126,
//     insuranceAccepted: ["AXA", "Allianz"],
//     gender: "female",
//     yearsOfExperience: 14,
//     availableOn: ["today", "tomorrow"],
//   },
//   {
//     id: "dr-omar",
//     fullName: "Dr. Omar Farid",
//     title: "Dermatologist",
//     verified: true,
//     specialties: ["Dermatology"],
//     city: "Cairo",
//     area: "Zamalek",
//     fees: 400,
//     currency: "EGP",
//     waitingTime: "15 min",
//     rating: 4.6,
//     reviewCount: 89,
//     insuranceAccepted: ["BUPA", "Cigna"],
//     gender: "male",
//     yearsOfExperience: 8,
//     availableOn: ["tomorrow"],
//   },
//   {
//     id: "dr-nadia",
//     fullName: "Dr. Nadia Karim",
//     title: "General practitioner",
//     verified: true,
//     specialties: ["General Medicine"],
//     city: "Giza",
//     area: "Mohandeseen",
//     fees: 300,
//     currency: "EGP",
//     waitingTime: "10 min",
//     rating: 4.7,
//     reviewCount: 210,
//     insuranceAccepted: ["Medicare", "AXA"],
//     gender: "female",
//     yearsOfExperience: 6,
//     availableOn: ["today"],
//   },
//   {
//     id: "dr-youssef",
//     fullName: "Dr. Youssef Adel",
//     title: "Pediatrician",
//     specialties: ["Pediatrics"],
//     city: "Alexandria",
//     area: "Downtown",
//     fees: 350,
//     currency: "EGP",
//     waitingTime: "25 min",
//     rating: 4.5,
//     reviewCount: 64,
//     insuranceAccepted: ["Allianz"],
//     gender: "male",
//     yearsOfExperience: 18,
//     availableOn: [],
//   },
// ];

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
  resetToken?: number;
};

// function matches(doctor: LandingDoctor, filters: LandingFilters): boolean {
//   if (filters.specialty && !doctor.specialties.includes(filters.specialty)) return false;
//   if (filters.city && doctor.city !== filters.city) return false;
//   if (filters.area && doctor.area !== filters.area) return false;
//   if (filters.insurance && !doctor.insuranceAccepted?.includes(filters.insurance)) return false;
//   if (filters.gender && doctor.gender !== filters.gender) return false;
//   if (
//     filters.maxPrice !== undefined &&
//     (doctor.fees ?? Number.POSITIVE_INFINITY) > filters.maxPrice
//   ) {
//     return false;
//   }
//   if (filters.minExperience !== undefined && doctor.yearsOfExperience < filters.minExperience) {
//     return false;
//   }
//   if (filters.availability && !doctor.availableOn.includes(filters.availability)) return false;
//   if (filters.search) {
//     const query = filters.search.trim().toLowerCase();
//     const haystack =
//       `${doctor.fullName} ${doctor.title} ${doctor.specialties.join(" ")}`.toLowerCase();
//     if (query && !haystack.includes(query)) return false;
//   }
//   return true;
// }

const _genderOptions: readonly DoctorGender[] = ["female", "male"];

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

  const _handleClear = useCallback(() => {
    const cleared: HCPFilters = {};
    setDraft(cleared);
    onApply(cleared);
  }, [onApply]);

  return (
    <div className="mb-6 rounded-2xl bg-accent/50 p-5">
      <form
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          handleApply();
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
            onChange={(event) => update("search", event.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-xl px-6">
          <Search className="mr-2 size-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILTER_OPTIONS.map((option) => {
          const Icon = FILTER_ICONS[option.key];
          return (
            <Select
              key={option.key}
              value={draft[option.key] ?? ""}
              onValueChange={(value) => update(option.key, value)}
            >
              <SelectTrigger
                id={option.id}
                aria-label={option.label}
                className="h-auto rounded-xl border-input bg-card px-3.5 py-2.5 shadow-none hover:bg-card"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col items-start gap-0.5">
                    <span className="type-helper text-muted-foreground">{option.label}</span>
                    <span className="type-label font-medium text-foreground">
                      <SelectValue placeholder={option.allLabel} />
                    </span>
                  </span>
                </span>
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
          );
        })}
      </div>
    </div>
  );
}
