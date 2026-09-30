"use client";

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

type SpecialtySelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function SpecialtySelect({ value, onValueChange }: SpecialtySelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="specialty">Specialty</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="specialty" aria-label="Select specialty">
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent aria-label="Specialty options">
          {HCP_SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
