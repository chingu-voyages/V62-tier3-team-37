"use client";

import type { ReactNode } from "react";
import { AuthCard } from "./AuthCard";
import { LoginForm } from "./LoginForm";

type LoginPanelProps = {
  tabs: ReactNode;
  /**
   * Panel wiring for the enclosing tab strip.
   *
   * `SlidingTabs` points every tab at `${idPrefix}-panel-${value}`, so the login
   * tab's `aria-controls` has to resolve to a real element or the role is
   * announced with no content behind it.
   */
  panel: { id: string; labelledBy: string };
  onCreateAccount: () => void;
};

/**
 * The login half of the tab strip.
 *
 * Split out of `AuthScreen` so the screen itself stays a Server Component: only
 * this panel and its form cross the client boundary, and `AuthPanels` can load
 * it on demand when the tab is actually opened.
 */
export function LoginPanel({ tabs, panel, onCreateAccount }: LoginPanelProps) {
  return (
    <AuthCard
      title="Welcome back"
      subtitle={<p>Log in with the email and password you used to create your account.</p>}
      tabs={tabs}
    >
      <div role="tabpanel" id={panel.id} aria-labelledby={panel.labelledBy}>
        <LoginForm onCreateAccount={onCreateAccount} />
      </div>
    </AuthCard>
  );
}
