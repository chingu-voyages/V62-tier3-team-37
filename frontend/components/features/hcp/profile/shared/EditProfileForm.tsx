"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { useUpdateHcpProfileMutation } from "@/hooks/use-hcp-profile-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import {
  type ApiGender,
  PROFILE_LIMITS,
  type UpdateHcpProfileInput,
} from "@/types/hcp-profile-api";
import { ProfileEditDialog } from "./ProfileEditDialog";

type EditableProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: ApiGender | "";
  phone: string;
  country: string;
  subSpecialty: string;
  workplaceName: string;
  workplaceAddress: string;
  city: string;
};

type EditProfileFormProps = {
  values: EditableProfile;
};

const GENDERS: { value: ApiGender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const MAX_DATE_OF_BIRTH = new Date().toISOString().slice(0, 10);

/**
 * Editor for the fields `PATCH /api/hcp/profile` accepts.
 *
 * Specialty, years of experience, license number and issuing authority are
 * deliberately absent: the API rejects them, so offering an input for them would
 * guarantee a 422. The read-only section says so instead of pretending to be
 * editable.
 */
export function EditProfileForm({ values }: EditProfileFormProps) {
  const [draft, setDraft] = useState<EditableProfile>(values);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useUpdateHcpProfileMutation();

  function set<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError(null);
  }

  async function handleSubmit() {
    setFormError(null);
    setFieldErrors({});

    const birthDate = draft.birthDate.trim();

    // `birth_date` is optional, but sending it empty is not the same as omitting
    // it: the API would answer 422 for a blank string instead of leaving the
    // stored value untouched.
    const payload: UpdateHcpProfileInput = {
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      ...(birthDate ? { birth_date: birthDate } : {}),
      ...(draft.gender === "" ? {} : { gender: draft.gender }),
      phone: draft.phone.trim() || null,
      country: draft.country.trim() || null,
      sub_specialty: draft.subSpecialty.trim() || null,
      workplace_name: draft.workplaceName.trim() || null,
      workplace_address: draft.workplaceAddress.trim() || null,
      city: draft.city.trim() || null,
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      setFieldErrors({
        firstName: getApiFieldError(error, "first_name") ?? "",
        lastName: getApiFieldError(error, "last_name") ?? "",
        birthDate: getApiFieldError(error, "birth_date") ?? "",
        gender: getApiFieldError(error, "gender") ?? "",
        phone: getApiFieldError(error, "phone") ?? "",
        country: getApiFieldError(error, "country") ?? "",
        subSpecialty: getApiFieldError(error, "sub_specialty") ?? "",
        workplaceName: getApiFieldError(error, "workplace_name") ?? "",
        workplaceAddress: getApiFieldError(error, "workplace_address") ?? "",
        city: getApiFieldError(error, "city") ?? "",
      });
      setFormError(getApiErrorMessage(error));
      throw error;
    }
  }

  return (
    <ProfileEditDialog
      title="Edit profile"
      description="Update your personal and professional details."
      triggerLabel="Edit profile"
      error={formError}
      pending={mutation.isPending}
      onOpen={() => {
        setDraft(values);
        setFormError(null);
        setFieldErrors({});
      }}
      onSubmit={handleSubmit}
    >
      <Callout icon={Info}>
        Specialty, years of experience and license details are set during verification and cannot be
        changed here.
      </Callout>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="pf-first-name"
          label="First name"
          required
          maxLength={PROFILE_LIMITS.name}
          value={draft.firstName}
          error={fieldErrors.firstName || undefined}
          onChange={(value) => set("firstName", value)}
        />
        <TextField
          id="pf-last-name"
          label="Last name"
          required
          maxLength={PROFILE_LIMITS.name}
          value={draft.lastName}
          error={fieldErrors.lastName || undefined}
          onChange={(value) => set("lastName", value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="pf-birth-date"
          label="Date of birth"
          type="date"
          max={MAX_DATE_OF_BIRTH}
          value={draft.birthDate}
          error={fieldErrors.birthDate || undefined}
          onChange={(value) => set("birthDate", value)}
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="pf-gender-male">Gender</Label>
          <RadioGroup
            id="pf-gender"
            value={draft.gender}
            onValueChange={(value) => set("gender", value as ApiGender)}
            aria-labelledby="pf-gender-label"
            aria-invalid={fieldErrors.gender ? true : undefined}
            className="sm:grid-cols-2"
          >
            {GENDERS.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2.5 rounded-lg border border-input px-3.5 py-2.5 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent"
              >
                <RadioGroupItem
                  id={`pf-gender-${option.value.toLowerCase()}`}
                  value={option.value}
                />
                <Label htmlFor={`pf-gender-${option.value.toLowerCase()}`} className="type-label">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="pf-phone"
          label="Phone"
          type="tel"
          maxLength={PROFILE_LIMITS.phone}
          placeholder="+20 100 000 0000"
          hint="Must be unique across the platform."
          value={draft.phone}
          error={fieldErrors.phone || undefined}
          onChange={(value) => set("phone", value)}
        />
        <TextField
          id="pf-country"
          label="Country"
          maxLength={PROFILE_LIMITS.country}
          value={draft.country}
          error={fieldErrors.country || undefined}
          onChange={(value) => set("country", value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="pf-sub-specialty"
          label="Sub-specialty"
          maxLength={PROFILE_LIMITS.subSpecialty}
          value={draft.subSpecialty}
          error={fieldErrors.subSpecialty || undefined}
          onChange={(value) => set("subSpecialty", value)}
        />
        <TextField
          id="pf-workplace-name"
          label="Workplace / Clinic"
          maxLength={PROFILE_LIMITS.workplaceName}
          value={draft.workplaceName}
          error={fieldErrors.workplaceName || undefined}
          onChange={(value) => set("workplaceName", value)}
        />
      </div>

      <TextField
        id="pf-workplace-address"
        label="Workplace address"
        maxLength={PROFILE_LIMITS.workplaceAddress}
        value={draft.workplaceAddress}
        error={fieldErrors.workplaceAddress || undefined}
        onChange={(value) => set("workplaceAddress", value)}
      />

      <TextField
        id="pf-city"
        label="City"
        maxLength={PROFILE_LIMITS.city}
        value={draft.city}
        error={fieldErrors.city || undefined}
        onChange={(value) => set("city", value)}
      />
    </ProfileEditDialog>
  );
}

export type { EditableProfile };
