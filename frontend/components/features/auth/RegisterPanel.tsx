"use client";

import type { ReactNode } from "react";
import { signupJourneySteps } from "@/lib/auth/journey";
import type { SignupRole } from "@/types/auth";
import { AuthCard } from "./AuthCard";
import { RegisterForm } from "./RegisterForm";
import { SignupRoleSwitch } from "./SignupRoleSwitch";

type RegisterPanelProps = {
  tabs: ReactNode;
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
  onLogIn: () => void;
  /**
   * Panel wiring for the enclosing tab strip.
   *
   * `SlidingTabs` points every tab at `${idPrefix}-panel-${value}`, so the
   * register tab's `aria-controls` has to resolve to a real element. The login
   * screen already rendered that panel; without it here the reference dangled
   * and the role was announced without any content.
   */
  panel: { id: string; labelledBy: string };
};

/**
 * The sign-up half of the tab strip.
 *
 * This used to be the whole of `RegisterForm`, card chrome included. The card is
 * now split out here so the screen above can stay a Server Component and load
 * this panel on demand — `RegisterForm` is left owning only the form itself.
 */
export function RegisterPanel({ tabs, role, onRoleChange, onLogIn, panel }: RegisterPanelProps) {
  return (
    <AuthCard
      step={{ current: 1, total: signupJourneySteps(role), detail: "Your details" }}
      title={role === "HCP" ? "Sign up as a clinician" : "Sign up as a patient"}
      subtitle={<SignupRoleSwitch role={role} onRoleChange={onRoleChange} />}
      tabs={tabs}
    >
      <div role="tabpanel" id={panel.id} aria-labelledby={panel.labelledBy}>
        <RegisterForm role={role} onLogIn={onLogIn} />
      </div>
    </AuthCard>
  );
}
