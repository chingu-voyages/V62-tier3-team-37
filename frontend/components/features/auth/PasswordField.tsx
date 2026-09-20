"use client";

import { useState } from "react";
import EyeIcon from "@/components/ui/eye-icon";
import EyeOffIcon from "@/components/ui/eye-off-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

/**
 * Label + password input + show/hide toggle + inline error.
 *
 * Visibility is local component state (never synchronised with the form):
 * the input keeps the real `type="password"`/`type="text"` controlled value
 * from TanStack Form. Layout note: the toggle button sits over the right side
 * of the input, so callers should treat the input's trailing padding as a
 * fixed reserved width rather than pushing the button outside the field.
 */
export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="pr-11"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
        >
          {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
        </button>
      </div>

      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
