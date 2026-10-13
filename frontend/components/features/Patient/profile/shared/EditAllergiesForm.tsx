"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ProfileEditDialog, SelectField } from "@/components/features/shared/profile";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import { useUpdatePatientProfileMutation } from "@/hooks/use-patient-profile-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import type { PatientAllergy } from "@/types/patient-profile";
import {
  ALLERGY_SEVERITIES,
  PATIENT_PROFILE_LIMITS,
  type UpdatePatientProfileInput,
} from "@/types/patient-profile-api";

type EditAllergiesFormProps = {
  values: PatientAllergy[];
};

/**
 * A row on screen. `key` is local because the API gives an allergy no id to key it
 * by, and a stable key is what keeps React from reusing the inputs of a removed row
 * for its neighbour.
 */
type DraftAllergy = {
  key: string;
  name: string;
  reaction: string;
  severity: string;
};

const SEVERITY_OPTIONS = ALLERGY_SEVERITIES.map((severity) => ({
  value: severity,
  label: severity,
}));

/**
 * Editor for the allergies list.
 *
 * Rows, not a comma-separated field: each allergy carries its own reaction and
 * severity, and the validator expects `allergies.*.name` / `.reaction` / `.severity`
 * - so a nameless row is a request that could only 422. Those are flagged here
 * instead of being sent.
 *
 * `severity` is free text on the wire, so the list is suggestions: a stored value
 * outside it round-trips untouched rather than being silently rewritten.
 */
export function EditAllergiesForm({ values }: EditAllergiesFormProps) {
  // Declared above the draft state, because seeding the draft draws from it.
  const nextKey = useRef(0);
  const [draft, setDraft] = useState<DraftAllergy[]>(() => toDraft(values));
  const [formError, setFormError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const mutation = useUpdatePatientProfileMutation();

  function toDraft(allergies: PatientAllergy[]): DraftAllergy[] {
    return allergies.map((allergy) => ({
      key: `allergy-${nextKey.current++}`,
      name: allergy.name,
      reaction: allergy.reaction ?? "",
      severity: allergy.severity ?? "",
    }));
  }

  function updateRow(key: string, patch: Partial<Omit<DraftAllergy, "key">>) {
    setDraft((previous) => previous.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setRowErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
    if (formError) setFormError(null);
  }

  function addRow() {
    setDraft((previous) => [
      ...previous,
      { key: `allergy-${nextKey.current++}`, name: "", reaction: "", severity: "" },
    ]);
    if (formError) setFormError(null);
  }

  function removeRow(key: string) {
    setDraft((previous) => previous.filter((row) => row.key !== key));
    if (formError) setFormError(null);
  }

  async function handleSubmit() {
    setFormError(null);

    const nextRowErrors: Record<string, string> = {};
    for (const row of draft) {
      if (row.name.trim() === "") {
        nextRowErrors[row.key] = "Give the allergy a name, or remove the row.";
      }
    }

    if (Object.keys(nextRowErrors).length > 0) {
      setRowErrors(nextRowErrors);
      return;
    }

    const payload: UpdatePatientProfileInput = {
      allergies: draft.map((row) => ({
        name: row.name.trim(),
        reaction: row.reaction.trim() || null,
        severity: row.severity.trim() || null,
      })),
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      // The API names the offending row by position, so the position is what maps
      // back onto the draft rows.
      const index = draft.findIndex((_row, position) =>
        getApiFieldError(error, `allergies.${position}.name`),
      );
      const failed = index >= 0 ? draft[index] : undefined;
      if (failed) {
        setRowErrors({ [failed.key]: getApiFieldError(error, `allergies.${index}.name`) ?? "" });
      }
      setFormError(getApiErrorMessage(error));
      throw error;
    }
  }

  return (
    <ProfileEditDialog
      title="Edit allergies"
      description="Anything you react to, and how severely."
      triggerLabel="Edit allergies"
      submitLabel="Save allergies"
      error={formError}
      pending={mutation.isPending}
      onOpen={() => {
        setDraft(toDraft(values));
        setFormError(null);
        setRowErrors({});
      }}
      onSubmit={handleSubmit}
    >
      {draft.length === 0 ? (
        <Callout>No allergies recorded yet. Add one below if you have any.</Callout>
      ) : null}

      {draft.map((row) => (
        <div
          key={row.key}
          className="flex min-w-0 flex-col gap-4 rounded-xl border border-border p-3.5 sm:p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="type-label font-medium text-foreground">{row.name || "New allergy"}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeRow(row.key)}
              aria-label={`Remove ${row.name || "allergy"}`}
            >
              <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
              Remove
            </Button>
          </div>

          <TextField
            id={`pp-allergy-name-${row.key}`}
            label="Name"
            required
            maxLength={PATIENT_PROFILE_LIMITS.allergyName}
            placeholder="Penicillin"
            value={row.name}
            error={rowErrors[row.key]}
            onChange={(value) => updateRow(row.key, { name: value })}
          />

          <TextField
            id={`pp-allergy-reaction-${row.key}`}
            label="Reaction"
            maxLength={PATIENT_PROFILE_LIMITS.allergyReaction}
            placeholder="Rash, swelling"
            hint="What happens when you are exposed. Optional."
            value={row.reaction}
            onChange={(value) => updateRow(row.key, { reaction: value })}
          />

          <SelectField
            id={`pp-allergy-severity-${row.key}`}
            label="Severity"
            options={SEVERITY_OPTIONS}
            placeholder="Not specified"
            className="sm:max-w-56"
            value={row.severity}
            onChange={(value) => updateRow(row.key, { severity: value })}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addRow} className="self-start">
        <Plus className="mr-1.5 size-4" aria-hidden="true" />
        Add allergy
      </Button>
    </ProfileEditDialog>
  );
}
