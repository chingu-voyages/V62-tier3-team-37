"use client";

import { inlineLinkClassName } from "@/components/ui/inline-link";
import type { SignupRole } from "@/types/auth";
import { SIGNUP_ROLE_LABELS } from "@/types/auth";

const OTHER_ROLE: Record<SignupRole, SignupRole> = {
  PATIENT: "HCP",
  HCP: "PATIENT",
};

const SWITCH_LABEL: Record<SignupRole, string> = {
  PATIENT: "Switch to a clinician account",
  HCP: "Switch to a patient account",
};

type SignupRoleSwitchProps = {
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
};

/**
 * Current account type, plus one control that moves to the other type.
 *
 * The button name states the destination, so the choice stays clear without a
 * second pair of radios above the form.
 */
export function SignupRoleSwitch({ role, onRoleChange }: SignupRoleSwitchProps) {
  const next = OTHER_ROLE[role];

  return (
    <p className="type-body text-muted-foreground">
      You&apos;re signing up as a{" "}
      <span className="font-medium text-foreground">{SIGNUP_ROLE_LABELS[role]}</span>.{" "}
      <button type="button" className={inlineLinkClassName} onClick={() => onRoleChange(next)}>
        {SWITCH_LABEL[role]}
      </button>
    </p>
  );
}
