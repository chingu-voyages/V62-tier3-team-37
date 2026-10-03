"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TextFieldProps = {
  id?: string;
  name?: string;
  /**
   * Visible label. Omit it only when a `<Label htmlFor>` is rendered separately
   * (compact grids, table-like rows) — and pass `ariaLabel` in that case so the
   * control still has an accessible name.
   */
  label?: string;
  ariaLabel?: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number | string;
  max?: number | string;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
  /** Rendered inside the field, after the control (e.g. a visibility toggle). */
  trailing?: React.ReactNode;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

/**
 * Labelled text input with inline validation.
 *
 * The single text-entry primitive for the app. It previously existed as two
 * near-identical components (`TextField` and `PasswordField`, 8 of 10 lines
 * shared) plus a fourth clone inside `PatientAppointments` and three more inline
 * copies in `HcpVerificationForm`.
 */
export function TextField({
  id,
  name,
  label,
  ariaLabel,
  type = "text",
  value,
  error,
  hint,
  placeholder,
  autoComplete,
  inputMode,
  required,
  disabled,
  readOnly,
  min,
  max,
  maxLength,
  autoFocus,
  className,
  trailing,
  onChange,
  onBlur,
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FormField
      id={fieldId}
      label={label ?? ariaLabel ?? ""}
      // A separate visible <Label> already names this control; rendering a second
      // one here would duplicate it for screen readers.
      hideLabel={label === undefined}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id: controlId, describedBy, invalid }) => (
        <div className="relative">
          <Input
            id={controlId}
            name={name}
            type={type}
            value={value}
            placeholder={placeholder}
            autoComplete={autoComplete}
            inputMode={inputMode}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            min={min}
            max={max}
            maxLength={maxLength}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className={cn(trailing && "pr-11")}
          />
          {trailing}
        </div>
      )}
    </FormField>
  );
}

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing">;

/**
 * Password input with a show/hide toggle.
 *
 * Focus is deliberately left on the input after toggling: moving focus to the
 * button meant typing silently stopped after one toggle.
 */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-primary focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          {visible ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
