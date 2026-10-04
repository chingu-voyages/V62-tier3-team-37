"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { SignupRole } from "@/types/auth";
import { isSignupRole, SIGNUP_ROLE_LABELS, SIGNUP_ROLES } from "@/types/auth";

const ROLES = SIGNUP_ROLES;

const ROLE_IDS: Record<SignupRole, string> = {
  PATIENT: "signup-role-patient",
  HCP: "signup-role-hcp",
};

/**
 * Narrow a Radix `onValueChange` string to a `SignupRole`.
 *
 * The value comes from the DOM, so it is genuinely untrusted input. A bare
 * `value as SignupRole` would let an unexpected string through and, because the
 * role decides the registration endpoint in `@/lib/api/auth-client`, straight into
 * a network call.
 */
function toSignupRole(value: string): SignupRole | undefined {
  return isSignupRole(value) ? value : undefined;
}

type SignupRoleSwitchProps = {
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
};

/**
 * Role selection for signup, rendered as a real radio group.
 *
 * This was a single toggle button whose accessible name doubled as its label
 * ("Sign up as a Healthcare Professional" one way, "Sign up as a Patient" the
 * other), so a screen-reader user tabbing back through the form could not tell
 * which option was current and which was available. It is now the same
 * `RadioGroup` pattern the gender field uses in the same form.
 */
export function SignupRoleSwitch({ role, onRoleChange }: SignupRoleSwitchProps) {
  return (
    <div data-motion="role-switch" className="flex flex-col gap-2">
      <p className="type-body text-muted-foreground">
        You&apos;re signing up as a{" "}
        <span className="font-medium text-foreground">{SIGNUP_ROLE_LABELS[role]}</span>.
      </p>

      <RadioGroup
        value={role}
        onValueChange={(value) => {
          const next = toSignupRole(value);
          if (next) onRoleChange(next);
        }}
        aria-label="Account type"
        className="grid gap-2 sm:grid-cols-2"
      >
        {ROLES.map((option) => {
          const id = ROLE_IDS[option];
          const selected = option === role;
          return (
            <div
              key={option}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors",
                "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent",
                selected ? "border-primary" : "border-input hover:border-primary/40",
              )}
            >
              <RadioGroupItem id={id} value={option} />
              <Label htmlFor={id} className="cursor-pointer type-label">
                {SIGNUP_ROLE_LABELS[option]}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
