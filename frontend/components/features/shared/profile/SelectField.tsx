"use client";

import { useId } from "react";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectFieldOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = {
  id?: string;
  label: string;
  /** Ordered as they will appear in the list. */
  options: SelectFieldOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown first, before the real options, and never submitted. */
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Labelled select, wired to `FormField` exactly like `TextField`.
 *
 * `TextField` covers every text input in the app but a closed set of values -
 * blood type, an allergy severity - is better chosen than typed, and bolting a
 * raw `Select` onto a form by hand is how the label/`aria-describedby` wiring
 * was lost in three places before `FormField` existed.
 *
 * The value is a string, never the domain union: an empty selection and "not
 * provided" are both `""`, which is what the callers already model.
 */
export function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  disabled,
  className,
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FormField
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id: controlId, describedBy, invalid }) => (
        <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
          <SelectTrigger
            id={controlId}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-11"
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
      )}
    </FormField>
  );
}
