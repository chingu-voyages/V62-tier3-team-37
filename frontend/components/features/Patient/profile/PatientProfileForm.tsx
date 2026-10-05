"use client";

import { Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FieldMessage } from "@/components/ui/field-message";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { useUpdatePatientProfileMutation } from "@/hooks/use-patient-profile-mutation";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import type { UpdatePatientProfileInput } from "@/lib/api/patient-client";
import type { PatientProfile } from "@/types/patient-profile";

const MIN_BIRTH_DATE = "1900-01-01";
const NONE = "none";

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

type GenderValue = (typeof GENDERS)[number]["value"];

type AllergyDraft = {
  key: string;
  name: string;
  reaction: string;
  severity: string;
};

type FieldErrors = Record<string, string>;

let allergyKey = 0;

function nextAllergyKey(): string {
  allergyKey += 1;
  return `allergy-${allergyKey}`;
}

function latestBirthDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function numericDraft(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return "";
  return String(numeric);
}

function allergyDrafts(profile: PatientProfile): AllergyDraft[] {
  const items = profile.patient_profile?.allergies ?? [];
  return items.flatMap((item) => {
    if (typeof item === "string") {
      const name = item.trim();
      return name ? [{ key: nextAllergyKey(), name, reaction: "", severity: "" }] : [];
    }
    const name = item.name?.trim() ?? "";
    if (!name) return [];
    return [
      {
        key: nextAllergyKey(),
        name,
        reaction: item.reaction?.trim() ?? "",
        severity: item.severity?.trim() ?? "",
      },
    ];
  });
}

function isGender(value: string): value is GenderValue {
  return value === "MALE" || value === "FEMALE";
}

export function PatientProfileForm({
  profile,
  onCancel,
  onSaved,
}: {
  profile: PatientProfile;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const updateProfile = useUpdatePatientProfileMutation();
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [birthDate, setBirthDate] = useState(profile.birth_date?.slice(0, 10) ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [bloodType, setBloodType] = useState(profile.patient_profile?.blood_type ?? "");
  const [height, setHeight] = useState(numericDraft(profile.patient_profile?.height_cm));
  const [weight, setWeight] = useState(numericDraft(profile.patient_profile?.weight_kg));
  const [allergies, setAllergies] = useState<AllergyDraft[]>(() => allergyDrafts(profile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function updateAllergy(key: string, patch: Partial<AllergyDraft>) {
    setAllergies((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate({
      firstName,
      lastName,
      birthDate,
      gender,
      phone,
      height,
      weight,
      allergies,
    });
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || !isGender(gender)) return;

    const input: UpdatePatientProfileInput = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
      gender,
      phone: phone.trim() || null,
      country: country.trim() || null,
      blood_type: bloodType || null,
      height_cm: height.trim() === "" ? null : Number(height),
      weight_kg: weight.trim() === "" ? null : Number(weight),
      allergies: allergies.map((row) => ({
        name: row.name.trim(),
        reaction: row.reaction.trim() || null,
        severity: row.severity.trim() || null,
      })),
    };

    updateProfile.mutate(input, {
      onSuccess: () => onSaved(),
      onError: (error) => {
        const collected: FieldErrors = {};
        for (const field of [
          "first_name",
          "last_name",
          "birth_date",
          "gender",
          "phone",
          "country",
          "blood_type",
          "height_cm",
          "weight_kg",
        ]) {
          const message = getApiFieldError(error, field);
          if (message) collected[field] = message;
        }
        allergies.forEach((row, index) => {
          const message = getApiFieldError(error, `allergies.${index}.name`);
          if (message) collected[`allergy-${row.key}`] = message;
        });
        setErrors(collected);
        setFormError(
          Object.keys(collected).length > 0
            ? null
            : getApiErrorMessage(error, "Could not save your profile."),
        );
      },
    });
  }

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <header className="flex flex-col gap-4 rounded-3xl border border-secondary/20 bg-accent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="type-step text-primary">Profile</p>
          <h1 className="mt-1 type-h2 text-foreground">Edit profile</h1>
          <p className="mt-1 type-body text-muted-foreground">
            Update your details. Your email stays the same.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={updateProfile.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {formError ? <Callout tone="danger">{formError}</Callout> : null}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70 sm:p-5">
          <div>
            <h2 className="type-h3 text-foreground">Personal</h2>
            <p className="mt-0.5 type-helper text-muted-foreground">
              Contact and identity details saved on this account.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="First name"
              name="first_name"
              autoComplete="given-name"
              required
              value={firstName}
              error={errors.first_name}
              onChange={setFirstName}
            />
            <TextField
              label="Last name"
              name="last_name"
              autoComplete="family-name"
              required
              value={lastName}
              error={errors.last_name}
              onChange={setLastName}
            />
          </div>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={profile.email ?? ""}
            hint="Email can't be changed."
            disabled
            readOnly
            onChange={() => undefined}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            error={errors.phone}
            onChange={setPhone}
          />
          <TextField
            label="Date of birth"
            name="birth_date"
            type="date"
            autoComplete="bday"
            required
            min={MIN_BIRTH_DATE}
            max={latestBirthDate()}
            value={birthDate}
            error={errors.birth_date}
            onChange={setBirthDate}
          />
          <ChoiceField
            id="profile-gender"
            label="Gender"
            required
            value={gender || undefined}
            placeholder="Select"
            error={errors.gender}
            onChange={setGender}
            options={GENDERS.map((option) => ({ value: option.value, label: option.label }))}
          />
          <TextField
            label="Country"
            name="country"
            autoComplete="country-name"
            value={country}
            error={errors.country}
            onChange={setCountry}
          />
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70 sm:p-5">
          <div>
            <h2 className="type-h3 text-foreground">Health</h2>
            <p className="mt-0.5 type-helper text-muted-foreground">
              Clinical details kept with your profile.
            </p>
          </div>
          <ChoiceField
            id="profile-blood-type"
            label="Blood type"
            value={bloodType || NONE}
            error={errors.blood_type}
            onChange={(value) => setBloodType(value === NONE ? "" : value)}
            options={[
              { value: NONE, label: "Not added" },
              ...BLOOD_TYPES.map((type) => ({ value: type, label: type })),
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Height (cm)"
              name="height_cm"
              type="number"
              inputMode="numeric"
              min={30}
              max={300}
              value={height}
              error={errors.height_cm}
              onChange={setHeight}
            />
            <TextField
              label="Weight (kg)"
              name="weight_kg"
              type="number"
              inputMode="decimal"
              min={1}
              max={500}
              value={weight}
              error={errors.weight_kg}
              onChange={setWeight}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="type-label text-foreground">Allergies</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAllergies((current) => [
                    ...current,
                    { key: nextAllergyKey(), name: "", reaction: "", severity: "" },
                  ])
                }
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
            {allergies.length === 0 ? (
              <p className="type-body text-muted-foreground">None recorded</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {allergies.map((row) => (
                  <li key={row.key} className="rounded-xl bg-muted p-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <TextField
                        label="Name"
                        value={row.name}
                        error={errors[`allergy-${row.key}`]}
                        onChange={(value) => updateAllergy(row.key, { name: value })}
                      />
                      <TextField
                        label="Reaction"
                        value={row.reaction}
                        onChange={(value) => updateAllergy(row.key, { reaction: value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="sm:mb-0.5"
                        onClick={() =>
                          setAllergies((current) => current.filter((item) => item.key !== row.key))
                        }
                      >
                        <Trash2 aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                    <div className="mt-3 max-w-xs">
                      <TextField
                        label="Severity"
                        value={row.severity}
                        onChange={(value) => updateAllergy(row.key, { severity: value })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

function ChoiceField({
  id,
  label,
  required,
  value,
  placeholder,
  error,
  options,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string | undefined;
  placeholder?: string;
  error?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-destructive">
              {" "}
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 w-full bg-card type-body"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldMessage id={`${id}-error`}>{error}</FieldMessage>
    </div>
  );
}

function validate(values: {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  height: string;
  weight: string;
  allergies: AllergyDraft[];
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.firstName.trim()) errors.first_name = "Enter your first name.";
  if (!values.lastName.trim()) errors.last_name = "Enter your last name.";
  if (!values.birthDate) {
    errors.birth_date = "Enter your date of birth.";
  } else if (values.birthDate > latestBirthDate()) {
    errors.birth_date = "Date of birth must be in the past.";
  }
  if (!isGender(values.gender)) errors.gender = "Select a gender.";
  if (values.phone.trim().length > 30) errors.phone = "Phone must be 30 characters or fewer.";

  if (values.height.trim() !== "") {
    const height = Number(values.height);
    if (!Number.isInteger(height) || height < 30 || height > 300) {
      errors.height_cm = "Height must be a whole number from 30 to 300 cm.";
    }
  }

  if (values.weight.trim() !== "") {
    const weight = Number(values.weight);
    if (Number.isNaN(weight) || weight < 1 || weight > 500) {
      errors.weight_kg = "Weight must be from 1 to 500 kg.";
    }
  }

  for (const row of values.allergies) {
    if (!row.name.trim()) errors[`allergy-${row.key}`] = "Enter an allergy name, or remove this row.";
  }

  return errors;
}
