"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { ProfileEditDialog } from "@/components/features/shared/profile";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/ui/text-field";
import { useUpdateHcpProfileMutation } from "@/hooks/use-hcp-profile-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  type ApiConsultationType,
  CONSULTATION_TYPE_LABELS,
  PROFILE_LIMITS,
} from "@/types/hcp-profile-api";

const CONSULTATION_TYPES = Object.keys(CONSULTATION_TYPE_LABELS) as ApiConsultationType[];

type EditDetailsFormProps = {
  values: {
    bio: string;
    languages: string[];
    consultationTypes: ApiConsultationType[];
  };
};

/**
 * Editor for the preferences block.
 *
 * Languages are case-insensitively unique per the API, so duplicates are rejected
 * here with a specific message instead of a 422 naming `languages.0`. The limit is
 * also enforced client-side to match `PROFILE_LIMITS.languages`.
 */
export function EditDetailsForm({ values }: EditDetailsFormProps) {
  const [bio, setBio] = useState(values.bio);
  const [languages, setLanguages] = useState<string[]>(values.languages);
  const [languageInput, setLanguageInput] = useState("");
  const [types, setTypes] = useState<ApiConsultationType[]>(values.consultationTypes);
  const [formError, setFormError] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | undefined>();

  const mutation = useUpdateHcpProfileMutation();

  function addLanguage() {
    const trimmed = languageInput.trim();
    setLanguageError(undefined);
    if (!trimmed) return;

    if (trimmed.length > PROFILE_LIMITS.languageLength) {
      setLanguageError(`Keep each language under ${PROFILE_LIMITS.languageLength} characters.`);
      return;
    }

    if (languages.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setLanguageError("That language is already listed.");
      return;
    }

    if (languages.length >= PROFILE_LIMITS.languages) {
      setLanguageError(`You can list up to ${PROFILE_LIMITS.languages} languages.`);
      return;
    }

    setLanguages((previous) => [...previous, trimmed]);
    setLanguageInput("");
  }

  function toggleType(type: ApiConsultationType, checked: boolean) {
    setTypes((previous) => {
      if (!checked) return previous.filter((value) => value !== type);
      // The API caps this at 3 and every value is in the enum, so the only way to
      // exceed the cap is to tick a fourth box.
      return previous.length >= PROFILE_LIMITS.consultationTypes ? previous : [...previous, type];
    });
  }

  function handleSubmit() {
    setFormError(null);

    return mutation
      .mutateAsync({
        bio: bio.trim() || null,
        languages,
        consultation_types: types,
      })
      .catch((error: unknown) => {
        setLanguageError(getApiFieldError(error, "languages") ?? undefined);
        setFormError(getApiErrorMessage(error));
        // Re-throw so `ProfileEditDialog` keeps the dialog open on failure.
        throw error;
      });
  }

  return (
    <ProfileEditDialog
      title="Edit languages, consultation types and bio"
      description="Tell patients how you work and what you speak."
      triggerLabel="Edit languages and bio"
      error={formError}
      pending={mutation.isPending}
      onOpen={() => {
        setBio(values.bio);
        setLanguages(values.languages);
        setTypes(values.consultationTypes);
        setLanguageInput("");
        setLanguageError(undefined);
        setFormError(null);
      }}
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="pd-language-input">Languages</Label>
        <div className="flex gap-2">
          <TextField
            id="pd-language-input"
            className="flex-1"
            ariaLabel="Language to add"
            placeholder="e.g. Arabic"
            maxLength={PROFILE_LIMITS.languageLength}
            value={languageInput}
            onChange={setLanguageInput}
            onBlur={addLanguage}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Add language"
            onClick={addLanguage}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {languageError ? (
          <p role="alert" className="type-helper text-destructive">
            {languageError}
          </p>
        ) : null}

        {languages.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-2">
            {languages.map((language) => (
              <li
                key={language}
                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-accent px-2.5 py-1 type-helper text-primary"
              >
                {language}
                <button
                  type="button"
                  onClick={() =>
                    setLanguages((previous) => previous.filter((value) => value !== language))
                  }
                  aria-label={`Remove ${language}`}
                  className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-helper text-muted-foreground">No languages added yet.</p>
        )}
      </div>

      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="type-label text-foreground">
          Consultation types
          <span className="ml-1.5 font-normal text-muted-foreground">
            (up to {PROFILE_LIMITS.consultationTypes})
          </span>
        </legend>

        {CONSULTATION_TYPES.map((type) => {
          const checked = types.includes(type);
          const atLimit = !checked && types.length >= PROFILE_LIMITS.consultationTypes;

          return (
            // Not a <label> wrapper: the Checkbox renders a <button role="checkbox">,
            // not a native input, so a wrapping <label> is not associated with it and
            // the row's click target covers only part of the control. The <Label
            // htmlFor> below does the associating instead.
            <div
              key={type}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors",
                checked ? "border-primary bg-accent" : "border-input",
                atLimit && "opacity-50",
              )}
            >
              <Checkbox
                id={`pd-type-${type}`}
                checked={checked}
                disabled={atLimit}
                onCheckedChange={(value) => toggleType(type, value === true)}
              />
              <Label htmlFor={`pd-type-${type}`} className="type-label">
                {CONSULTATION_TYPE_LABELS[type]}
              </Label>
            </div>
          );
        })}
      </fieldset>

      <TextField
        id="pd-bio"
        label="Professional bio"
        maxLength={PROFILE_LIMITS.bio}
        placeholder="A short introduction patients will read on your profile."
        value={bio}
        onChange={setBio}
      />

      <Callout>
        {bio.length}/{PROFILE_LIMITS.bio} characters used.
      </Callout>
    </ProfileEditDialog>
  );
}
