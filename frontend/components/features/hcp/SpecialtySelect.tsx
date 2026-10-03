"use client";

import { FieldMessage } from "@/components/ui/field-message";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const HCP_SPECIALTIES = [
  "General Practitioner",
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "Obstetrics & Gynecology",
  "Ophthalmology",
  "ENT",
  "Urology",
  "Endocrinology",
  "Pulmonology",
  "Radiology",
  "Pathology",
  "Anesthesiology",
  "Emergency Medicine",
  "Other",
] as const;

export type HcpSpecialty = (typeof HCP_SPECIALTIES)[number];

type SpecialtySelectProps = {
  id?: string;
  value?: string;
  error?: string;
  onValueChange?: (value: string) => void;
};

export function SpecialtySelect({
  id = "specialty",
  value,
  error,
  onValueChange,
}: SpecialtySelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>Specialty</Label>

      <Select value={value} onValueChange={onValueChange}>
        {/* The trigger carries the accessible name and the invalid/description
            wiring. It previously set `aria-label="Select specialty"`, which
            overrode the visible <Label> so AT announced the placeholder instead
            of the field name, and left nowhere to attach an error. */}
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent>
          {HCP_SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FieldMessage id={error ? errorId : undefined}>{error}</FieldMessage>
    </div>
  );
}
