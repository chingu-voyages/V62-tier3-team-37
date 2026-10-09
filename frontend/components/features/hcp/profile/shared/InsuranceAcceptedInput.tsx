"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldMessage } from "@/components/ui/field-message";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COMMON_INSURANCES, PROFILE_LIMITS } from "@/types/hcp-profile-api";

type InsuranceAcceptedInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

/**
 * Insurer list as removable chips, since a profile can accept several.
 *
 * Kept as its own component rather than an inline loop: the chip row, the
 * add-by-typing input and the suggestion list are three pieces of state, which
 * would otherwise bury `EditProfileForm`.
 */
export function InsuranceAcceptedInput({ value, onChange, error }: InsuranceAcceptedInputProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const [entry, setEntry] = useState("");

  function add(raw: string) {
    const name = raw.trim();
    if (!name) return;

    const exists = value.some((item) => item.toLowerCase() === name.toLowerCase());
    if (exists) {
      setEntry("");
      return;
    }
    if (value.length >= PROFILE_LIMITS.insuranceCount) return;

    onChange([...value, name]);
    setEntry("");
  }

  function remove(name: string) {
    onChange(value.filter((item) => item !== name));
  }

  const suggestions = COMMON_INSURANCES.filter(
    (option) => !value.some((item) => item.toLowerCase() === option.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>
        Insurance accepted
        <span className="ml-2 font-normal text-muted-foreground">Optional</span>
      </Label>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((name) => (
            <li key={name}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pl-2.5 pr-1.5 type-helper text-primary">
                {name}
                <button
                  type="button"
                  onClick={() => remove(name)}
                  aria-label={`Remove ${name}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-secondary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={entry}
          placeholder="e.g. AXA"
          maxLength={PROFILE_LIMITS.insuranceLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          onChange={(event) => setEntry(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the typed name instead of submitting the dialog.
            if (event.key === "Enter") {
              event.preventDefault();
              add(entry);
            }
          }}
          className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 type-body outline-none placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive"
        />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => add(entry)}
          disabled={!entry.trim()}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-helper text-muted-foreground">Common:</span>
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => add(option)}
              className={cn(
                "rounded-full border border-border bg-card px-2.5 py-1 type-helper text-muted-foreground",
                "transition-colors hover:border-primary/30 hover:bg-accent hover:text-primary",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      <FieldMessage id={messageId}>{error}</FieldMessage>
    </div>
  );
}
