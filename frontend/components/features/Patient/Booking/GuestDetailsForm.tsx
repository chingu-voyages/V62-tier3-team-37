"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { GENDER_OPTIONS } from "@/types/auth";

import type { BookingGuest } from "./booking-types";

type GuestDetailsFormProps = {
  guest: BookingGuest;
  onChange: (field: keyof BookingGuest, value: string) => void;
};

/**
 * Details for a visit booked on someone else's behalf.
 *
 * Rendered from a field map rather than four hand-written fields so the layout
 * and the required markers stay consistent as fields are added.
 */
export function GuestDetailsForm({ guest, onChange }: GuestDetailsFormProps) {
  return (
    <div className="mt-4 grid gap-4">
      <p className="type-helper text-muted-foreground">
        We&rsquo;ll send the visit details to this person.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="guest-first-name"
          label="First name"
          autoComplete="off"
          value={guest.firstName}
          onChange={(value) => onChange("firstName", value)}
          required
        />
        <TextField
          id="guest-last-name"
          label="Last name"
          autoComplete="off"
          value={guest.lastName}
          onChange={(value) => onChange("lastName", value)}
          required
        />
      </div>

      <TextField
        id="guest-email"
        label="Email address"
        type="email"
        autoComplete="off"
        value={guest.email}
        onChange={(value) => onChange("email", value)}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="guest-birth-date"
          label="Date of birth"
          type="date"
          value={guest.birthDate}
          onChange={(value) => onChange("birthDate", value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="guest-gender">
            Gender
            <span aria-hidden="true" className="text-destructive">
              {" "}
              *
            </span>
          </Label>
          <Select
            value={guest.gender ?? undefined}
            onValueChange={(value) => onChange("gender", value)}
          >
            <SelectTrigger id="guest-gender" className="h-11 w-full bg-card type-body">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
