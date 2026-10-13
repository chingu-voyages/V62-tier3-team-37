"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { ProfileEditDialog } from "@/components/features/shared/profile";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import { useUpdatePatientProfileMutation } from "@/hooks/use-patient-profile-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import type { PatientEditableContact } from "@/types/patient-profile";
import {
  PATIENT_PROFILE_LIMITS,
  type UpdatePatientProfileInput,
} from "@/types/patient-profile-api";

type EditContactFormProps = {
  values: PatientEditableContact;
};

/**
 * Editor for the two contact fields `PATCH /api/patient/profile` accepts.
 *
 * `phone` and `country` are the only `users` columns `UpdatePatientProfileRequest`
 * validates, so they are the only ones offered here. Name, date of birth, gender
 * and email are absent from that request entirely - an input for any of them could
 * only ever produce a 422, so the callout says so rather than pretending.
 */
export function EditContactForm({ values }: EditContactFormProps) {
  const [draft, setDraft] = useState<PatientEditableContact>(values);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useUpdatePatientProfileMutation();

  function set<K extends keyof PatientEditableContact>(key: K, value: PatientEditableContact[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError(null);
  }

  async function handleSubmit() {
    setFormError(null);
    setFieldErrors({});

    const phone = draft.phone.trim();
    const country = draft.country.trim();

    // An empty field means "clear this", which is `null` and not `""`: the stored
    // value is nullable, so a blank string would be stored as a blank string
    // rather than cleared.
    const payload: UpdatePatientProfileInput = {
      phone: phone === "" ? null : phone,
      country: country === "" ? null : country,
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      setFieldErrors({
        phone: getApiFieldError(error, "phone") ?? "",
        country: getApiFieldError(error, "country") ?? "",
      });
      setFormError(getApiErrorMessage(error));
      // Re-thrown so `ProfileEditDialog` keeps the dialog open with the draft
      // intact instead of closing over failed input.
      throw error;
    }
  }

  return (
    <ProfileEditDialog
      title="Edit contact details"
      description="How we and the clinicians you book with reach you."
      triggerLabel="Edit contact details"
      error={formError}
      pending={mutation.isPending}
      onOpen={() => {
        setDraft(values);
        setFormError(null);
        setFieldErrors({});
      }}
      onSubmit={handleSubmit}
    >
      <TextField
        id="pp-phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={PATIENT_PROFILE_LIMITS.phone}
        placeholder="+20 100 000 0000"
        hint="Must be unique across the platform. Leave empty to remove it."
        value={draft.phone}
        error={fieldErrors.phone || undefined}
        onChange={(value) => set("phone", value)}
      />

      <TextField
        id="pp-country"
        label="Country"
        autoComplete="country-name"
        maxLength={PATIENT_PROFILE_LIMITS.country}
        placeholder="Egypt"
        hint="Saved in uppercase (for example EGYPT)."
        value={draft.country}
        error={fieldErrors.country || undefined}
        onChange={(value) => set("country", value)}
      />

      <Callout icon={Info}>
        Your name, date of birth, gender and email are set when your account is created, so they
        cannot be changed here.
      </Callout>
    </ProfileEditDialog>
  );
}
