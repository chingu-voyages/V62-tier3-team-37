"use client";

import { BadgeCheck, ChevronDown, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import type { HCP, HCPFilters } from "@/types/hcp-directory";

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

const SAMPLE_DOCTORS: LandingDoctor[] = [
  {
    id: "dr-lina",
    fullName: "Dr. Lina Hassan",
    title: "Consultant cardiologist",
    verified: true,
    specialties: ["Cardiology"],
    city: "Cairo",
    area: "Maadi",
    fees: 500,
    currency: "EGP",
    waitingTime: "20 min",
    rating: 4.8,
    reviewCount: 126,
    insuranceAccepted: ["AXA", "Allianz"],
    gender: "female",
    yearsOfExperience: 14,
    availableOn: ["today", "tomorrow"],
  },
  {
    id: "dr-omar",
    fullName: "Dr. Omar Farid",
    title: "Dermatologist",
    verified: true,
    specialties: ["Dermatology"],
    city: "Cairo",
    area: "Zamalek",
    fees: 400,
    currency: "EGP",
    waitingTime: "15 min",
    rating: 4.6,
    reviewCount: 89,
    insuranceAccepted: ["BUPA", "Cigna"],
    gender: "male",
    yearsOfExperience: 8,
    availableOn: ["tomorrow"],
  },
  {
    id: "dr-nadia",
    fullName: "Dr. Nadia Karim",
    title: "General practitioner",
    verified: true,
    specialties: ["General Medicine"],
    city: "Giza",
    area: "Mohandeseen",
    fees: 300,
    currency: "EGP",
    waitingTime: "10 min",
    rating: 4.7,
    reviewCount: 210,
    insuranceAccepted: ["Medicare", "AXA"],
    gender: "female",
    yearsOfExperience: 6,
    availableOn: ["today"],
  },
  {
    id: "dr-youssef",
    fullName: "Dr. Youssef Adel",
    title: "Pediatrician",
    specialties: ["Pediatrics"],
    city: "Alexandria",
    area: "Downtown",
    fees: 350,
    currency: "EGP",
    waitingTime: "25 min",
    rating: 4.5,
    reviewCount: 64,
    insuranceAccepted: ["Allianz"],
    gender: "male",
    yearsOfExperience: 18,
    availableOn: [],
  },
];

const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
];
const CITIES = ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan"];
const AREAS = ["Downtown", "Heliopolis", "Maadi", "Zamalek", "Mohandeseen"];
const INSURANCES = ["Medicare", "AXA", "Allianz", "Cigna", "BUPA"];

function matches(doctor: LandingDoctor, filters: LandingFilters): boolean {
  if (filters.specialty && !doctor.specialties.includes(filters.specialty)) return false;
  if (filters.city && doctor.city !== filters.city) return false;
  if (filters.area && doctor.area !== filters.area) return false;
  if (filters.insurance && !doctor.insuranceAccepted?.includes(filters.insurance)) return false;
  if (filters.gender && doctor.gender !== filters.gender) return false;
  if (
    filters.maxPrice !== undefined &&
    (doctor.fees ?? Number.POSITIVE_INFINITY) > filters.maxPrice
  ) {
    return false;
  }
  if (filters.minExperience !== undefined && doctor.yearsOfExperience < filters.minExperience) {
    return false;
  }
  if (filters.availability && !doctor.availableOn.includes(filters.availability)) return false;
  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    const haystack =
      `${doctor.fullName} ${doctor.title} ${doctor.specialties.join(" ")}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
  }
  return true;
}

export function LandingSearch({
  signedIn = false,
  patientName,
}: {
  signedIn?: boolean;
  patientName?: string;
}) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [insurance, setInsurance] = useState("");
  const [gender, setGender] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<HCP | null>(null);

  const filters = useMemo<LandingFilters>(
    () => ({
      search: query.trim() || undefined,
      specialty: specialty || undefined,
      city: city || undefined,
      area: area || undefined,
      insurance: insurance || undefined,
      gender: gender === "female" || gender === "male" ? gender : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minExperience: minExperience ? Number(minExperience) : undefined,
      availability:
        availability === "today" || availability === "tomorrow" ? availability : undefined,
    }),
    [area, availability, city, gender, insurance, maxPrice, minExperience, query, specialty],
  );

  const results = useMemo(() => {
    if (!applied) return [];
    return SAMPLE_DOCTORS.filter((doctor) => matches(doctor, filters));
  }, [applied, filters]);

  const extraCount = [gender, maxPrice, minExperience, availability].filter(Boolean).length;

  function search() {
    setApplied(true);
  }

  function clearFilters() {
    setQuery("");
    setSpecialty("");
    setCity("");
    setArea("");
    setInsurance("");
    setGender("");
    setMaxPrice("");
    setMinExperience("");
    setAvailability("");
  }

  return (
    <section aria-labelledby="landing-heading" className="flex flex-col gap-8">
      <div className="max-w-2xl">
        {signedIn ? (
          <p className="inline-flex w-fit items-center rounded-full bg-accent px-3 py-1 type-helper font-medium text-primary">
            {patientName ? `Signed in as ${patientName}` : "Signed in"}
          </p>
        ) : (
          <p className="type-step text-primary">Guest booking</p>
        )}
        <h1 id="landing-heading" className="mt-3 type-h1 text-foreground">
          {signedIn
            ? patientName
              ? `Hello, ${patientName}`
              : "Hello"
            : "Find a doctor and book without an account"}
        </h1>
        <p className="mt-3 max-w-xl type-body text-muted-foreground">
          {signedIn
            ? "Find a doctor by name or specialty. Any visit you request is booked on your account."
            : "Search by name or specialty, then narrow the list. You can request a visit before you sign up."}
        </p>
      </div>

      <search className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border sm:p-6">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <TextField
                id="landing-search"
                name="search"
                label="Search doctors"
                placeholder="Doctor name, specialty, or clinic"
                value={query}
                onChange={setQuery}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1 sm:flex-none">
                <Search aria-hidden="true" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="lg:hidden"
                aria-expanded={filtersOpen}
                aria-controls="landing-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal aria-hidden="true" />
                Filters
              </Button>
            </div>
          </div>

          <div id="landing-filters" className={filtersOpen ? undefined : "hidden lg:block"}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                id="landing-specialty"
                label="Specialty"
                placeholder="All specialties"
                value={specialty}
                options={SPECIALTIES}
                onChange={setSpecialty}
              />
              <FilterSelect
                id="landing-city"
                label="City"
                placeholder="All cities"
                value={city}
                options={CITIES}
                onChange={setCity}
              />
              <FilterSelect
                id="landing-area"
                label="Area"
                placeholder="All areas"
                value={area}
                options={AREAS}
                onChange={setArea}
              />
              <FilterSelect
                id="landing-insurance"
                label="Insurance"
                placeholder="All insurance"
                value={insurance}
                options={INSURANCES}
                onChange={setInsurance}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              aria-expanded={extraOpen}
              aria-controls="landing-extra-filters"
              onClick={() => setExtraOpen((open) => !open)}
            >
              Extra options
              {extraCount > 0 ? (
                <span className="rounded-full bg-accent px-2 py-0.5 type-helper text-primary">
                  {extraCount}
                </span>
              ) : null}
              <ChevronDown
                aria-hidden="true"
                className={cn("transition-transform", extraOpen ? "rotate-180" : undefined)}
              />
            </Button>
            {query || specialty || city || area || insurance || extraCount > 0 ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            ) : null}
          </div>

          <fieldset
            id="landing-extra-filters"
            hidden={!extraOpen}
            className="rounded-xl bg-muted p-4"
          >
            <legend className="px-1 type-label text-foreground">Extra options</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                id="landing-gender"
                label="Gender"
                placeholder="Any gender"
                value={gender}
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
                onChange={setGender}
              />
              <FilterSelect
                id="landing-price"
                label="Price"
                placeholder="Any price"
                value={maxPrice}
                options={[
                  { value: "300", label: "Up to 300 EGP" },
                  { value: "400", label: "Up to 400 EGP" },
                  { value: "500", label: "Up to 500 EGP" },
                ]}
                onChange={setMaxPrice}
              />
              <FilterSelect
                id="landing-experience"
                label="Years of experience"
                placeholder="Any experience"
                value={minExperience}
                options={[
                  { value: "5", label: "5+ years" },
                  { value: "10", label: "10+ years" },
                  { value: "15", label: "15+ years" },
                ]}
                onChange={setMinExperience}
              />
              <FilterSelect
                id="landing-availability"
                label="Availability"
                placeholder="Any day"
                value={availability}
                options={[
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                ]}
                onChange={setAvailability}
              />
            </div>
          </fieldset>
        </form>
      </search>

      {applied ? (
        <div id="landing-results" className="flex flex-col gap-4">
          <h2 className="type-h3 text-foreground">
            {results.length === 1 ? "1 doctor" : `${results.length} doctors`}
          </h2>
          {results.length === 0 ? (
            <div className="rounded-2xl bg-card px-5 py-10 text-center shadow-soft ring-1 ring-border">
              <p className="type-body text-muted-foreground">
                No doctors match these filters. Clear one and search again.
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((doctor) => (
                <li key={doctor.id}>
                  <DoctorResult
                    doctor={doctor}
                    bookLabel={signedIn ? "Book visit" : "Book as guest"}
                    onBook={() => setBookingDoctor(doctor)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="type-body text-muted-foreground">
          {signedIn
            ? "Results appear after you search. Booking uses your account."
            : "Results appear after you search. Booking stays available without an account."}
        </p>
      )}

      <GuestBookingDialog
        doctor={bookingDoctor}
        signedIn={signedIn}
        onClose={() => setBookingDoctor(null)}
      />
    </section>
  );
}

function DoctorResult({
  doctor,
  onBook,
  bookLabel,
}: {
  doctor: LandingDoctor;
  onBook: () => void;
  bookLabel: string;
}) {
  const initials = doctor.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border sm:flex-row sm:items-center">
      <div
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-primary"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="type-h3 text-foreground">{doctor.fullName}</h3>
          {doctor.verified ? (
            <BadgeCheck className="size-5 text-secondary" aria-label="Verified professional" />
          ) : null}
          <span className="rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary">
            {doctor.specialties[0]}
          </span>
        </div>
        <p className="mt-1 type-body text-muted-foreground">{doctor.title}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-label text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {doctor.city}
            {doctor.area ? `, ${doctor.area}` : ""}
          </span>
          <span>
            {doctor.fees} {doctor.currency}
          </span>
          <span>{doctor.yearsOfExperience} years</span>
          <span className="capitalize">{doctor.gender}</span>
          <span>{formatAvailability(doctor.availableOn)}</span>
        </p>
      </div>
      <Button type="button" className="sm:shrink-0" onClick={onBook}>
        {bookLabel}
      </Button>
    </article>
  );
}

function formatAvailability(days: readonly Availability[]): string {
  const today = days.includes("today");
  const tomorrow = days.includes("tomorrow");
  if (today && tomorrow) return "Today and tomorrow";
  if (today) return "Today";
  if (tomorrow) return "Tomorrow";
  return "Later dates";
}

function FilterSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: readonly (string | { value: string; label: string })[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 bg-card type-body">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map((option) => {
            const optionValue = typeof option === "string" ? option : option.value;
            const optionLabel = typeof option === "string" ? option : option.label;
            return (
              <SelectItem key={optionValue} value={optionValue}>
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function GuestBookingDialog({
  doctor,
  signedIn,
  onClose,
}: {
  doctor: HCP | null;
  signedIn: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={doctor !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {doctor ? (
          <GuestBookingForm key={doctor.id} doctor={doctor} signedIn={signedIn} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GuestBookingForm({
  doctor,
  signedIn,
  onClose,
}: {
  doctor: HCP;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>{signedIn ? "Book a visit" : "Book as a guest"}</DialogTitle>
        <DialogDescription>
          {doctor.fullName}, {doctor.specialties[0]}.
          {signedIn ? "" : " No account is required."}
        </DialogDescription>
      </DialogHeader>
      {booked ? (
        <Callout title="Visit requested" role="status">
          {signedIn
            ? "We saved this request on your account."
            : "We saved this request under your name. Create an account later if you want to manage it."}
        </Callout>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !phone.trim() || !date) {
              setError("Name, phone, and a preferred date are required.");
              return;
            }
            setError(null);
            setBooked(true);
          }}
        >
          <TextField
            id="guest-name"
            name="name"
            label="Your name"
            value={name}
            onChange={setName}
            required
          />
          <TextField
            id="guest-phone"
            name="phone"
            label="Phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            required
          />
          <TextField
            id="guest-date"
            name="date"
            label="Preferred date"
            type="date"
            value={date}
            onChange={setDate}
            required
          />
          {error ? (
            <p role="alert" className="type-helper text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit">Request visit</Button>
          </DialogFooter>
        </form>
      )}
      {booked ? (
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}
