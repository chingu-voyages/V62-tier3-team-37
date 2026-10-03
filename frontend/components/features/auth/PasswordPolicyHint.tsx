"use client";

import { Check, X } from "lucide-react";
import { PASSWORD_RULES, unmetPasswordRules } from "@/lib/validation/password";

type PasswordPolicyHintProps = {
  value: string;
};

/**
 * Live checklist of the password policy.
 *
 * The rules mirror the server's `Password::min(8)->mixedCase()->numbers()->symbols()`.
 * Without this the form accepted `password123`, submitted it, and came back with a
 * 422 — the user could not tell which rule they had missed until after the fact.
 *
 * Colour is never the only signal: each row carries an icon and states the
 * requirement in words.
 */
export function PasswordPolicyHint({ value }: PasswordPolicyHintProps) {
  if (value.length === 0) return null;

  const unmet = unmetPasswordRules(value);
  const allMet = unmet.length === 0;

  return (
    <>
      <ul aria-label="Password requirements" className="flex flex-col gap-1">
        {PASSWORD_RULES.map((rule) => {
          const satisfied = rule.test(value);
          const Icon = satisfied ? Check : X;

          return (
            <li
              key={rule.message}
              className={
                satisfied
                  ? "flex items-center gap-1.5 type-helper text-primary"
                  : "flex items-center gap-1.5 type-helper text-muted-foreground"
              }
            >
              <Icon className="size-3 shrink-0" aria-hidden="true" />
              <span>{rule.message}</span>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {allMet ? "All password requirements met" : `${unmet.length} requirements remaining`}
      </p>
    </>
  );
}
