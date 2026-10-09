"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { ProfileEditDialog, SelectField } from "@/components/features/shared/profile";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import { useUpdatePatientProfileMutation } from "@/hooks/use-patient-profile-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import type { PatientEditableHealth } from "@/types/patient-profile";
import {
  BLOOD_TYPES,
  PATIENT_PROFILE_LIMITS,
  type UpdatePatientProfileInput,
} from "@/types/patient-profile-api";

type EditHealthFormProps = {
  values: PatientEditableHealth;
};

const BLOOD_TYPE_OPTIONS = BLOOD_TYPES.map((type) => ({ value: type, label: type }));

/**
 * A number inside the range the validator accepts, or `undefined` when the field
 * is blank or out of bounds.
 *
 * Returns `undefined` for both "not provided" and "not a number", so `handleSubmit`
 * tells those two apart by looking at the raw text first - a blank field clears
 * the stored value, while a mistyped one is an error worth saying so about.
 */
function toNumberInRange(raw: string, min: number, max: number): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
  return Math.round(parsed * 100) / 100;
}

/**
 * Editor for the medical fields `PATCH /api/patient/profile` accepts.
 *
 * Blood type is a closed enum on the wire, so it is chosen rather than typed.
 * Height and weight are bounded client-side against the same limits the validator
 * enforces, so a mistyped value is caught before the round trip - the validator
 * stays the authority.
 */
export function EditHealthForm({ values }: EditHealthFormProps) {
  const [draft, setDraft] = useState<PatientEditableHealth>(values);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useUpdatePatientProfileMutation();

  function set<K extends keyof PatientEditableHealth>(key: K, value: PatientEditableHealth[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError(null);
  }

  async function handleSubmit() {
    setFormError(null);

    const heightText = draft.heightCm.trim();
    const weightText = draft.weightKg.trim();
    const heightCm = toNumberInRange(
      heightText,
      PATIENT_PROFILE_LIMITS.heightMin,
      PATIENT_PROFILE_LIMITS.heightMax,
    );
    const weightKg = toNumberInRange(
      weightText,
      PATIENT_PROFILE_LIMITS.weightMin,
      PATIENT_PROFILE_LIMITS.weightMax,
    );

    const nextErrors: Record<string, string> = {};
    if (heightText !== "" && heightCm === undefined) {
      nextErrors.heightCm = `Enter a height between ${PATIENT_PROFILE_LIMITS.heightMin} and ${PATIENT_PROFILE_LIMITS.heightMax} cm.`;
    }
    if (weightText !== "" && weightKg === undefined) {
      nextErrors.weightKg = `Enter a weight between ${PATIENT_PROFILE_LIMITS.weightMin} and ${PATIENT_PROFILE_LIMITS.weightMax} kg.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const payload: UpdatePatientProfileInput = {
      blood_type: draft.bloodType === "" ? null : draft.bloodType,
      height_cm: heightCm,
      weight_kg: weightKg,
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      setFieldErrors({
        bloodType: getApiFieldError(error, "blood_type") ?? "",
        heightCm: getApiFieldError(error, "height_cm") ?? "",
        weightKg: getApiFieldError(error, "weight_kg") ?? "",
      });
      setFormError(getApiErrorMessage(error));
      throw error;
    }
  }

  return (
    <ProfileEditDialog
      title="Edit health details"
      description="The basics a clinician needs before a visit."
      triggerLabel="Edit health details"
      error={formError}
      pending={mutation.isPending}
      onOpen={() => {
        setDraft(values);
        setFormError(null);
        setFieldErrors({});
      }}
      onSubmit={handleSubmit}
    >
      <SelectField
        id="pp-blood-type"
        label="Blood type"
        options={BLOOD_TYPE_OPTIONS}
        placeholder="Not set"
        value={draft.bloodType}
        error={fieldErrors.bloodType || undefined}
        onChange={(value) => set("bloodType", value as PatientEditableHealth["bloodType"])}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="pp-height"
          label="Height"
          type="number"
          inputMode="numeric"
          min={PATIENT_PROFILE_LIMITS.heightMin}
          max={PATIENT_PROFILE_LIMITS.heightMax}
          placeholder="166"
          hint="Centimetres. Leave empty to remove it."
          value={draft.heightCm}
          error={fieldErrors.heightCm || undefined}
          onChange={(value) => set("heightCm", value)}
        />

        <TextField
          id="pp-weight"
          label="Weight"
          type="number"
          inputMode="decimal"
          min={PATIENT_PROFILE_LIMITS.weightMin}
          max={PATIENT_PROFILE_LIMITS.weightMax}
          placeholder="61.5"
          hint="Kilograms. Leave empty to remove it."
          value={draft.weightKg}
          error={fieldErrors.weightKg || undefined}
          onChange={(value) => set("weightKg", value)}
        />
      </div>

      <Callout icon={Info}>
        Your height and weight are also used to work out the BMI shown on your profile.
      </Callout>
    </ProfileEditDialog>
  );
}
