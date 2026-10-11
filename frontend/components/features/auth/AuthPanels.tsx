"use client";

import { type ReactNode, useId, useState } from "react";
import { AnimatedSize, SlidingTabs } from "@/components/motion";
import type { SignupRole } from "@/types/auth";
import { LoginPanel } from "./LoginPanel";
import { RegisterPanel } from "./RegisterPanel";

export type AuthTab = "login" | "register";

type AuthPanelsProps = {
  initialTab?: AuthTab;
  initialRole?: SignupRole;
};

const TABS: { value: AuthTab; label: string }[] = [
  { value: "register", label: "Sign up" },
  { value: "login", label: "Log in" },
];

/**
 * The interactive half of the auth screen: which tab is showing, and the signup
 * role.
 *
 * This is the only place the tab state lives, which is what lets `AuthScreen`
 * stay a Server Component. Nothing below it is marked `"use client"` except the
 * pieces that genuinely need to be: the tab strip, the two forms, and the
 * animated size wrapper.
 *
 * The two panels are imported statically rather than through `next/dynamic`.
 * That was tried and measured: it cost ~49 KB more gzip on both tabs, because
 * the panels share almost all of their dependencies — TanStack Form, zod, the
 * Radix primitives — so splitting them duplicated that shared code across chunk
 * boundaries instead of deferring anything. Code splitting only pays here when
 * the deferred part shares little with the rest of the page, which is why the
 * confirmation dialog and the calendar panel *are* lazy and these two are not.
 */
export function AuthPanels({ initialTab = "register", initialRole = "PATIENT" }: AuthPanelsProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [role, setRole] = useState<SignupRole>(initialRole);
  const baseId = useId();

  const tabs: ReactNode = (
    <SlidingTabs
      items={TABS}
      value={tab}
      onChange={setTab}
      aria-label="Sign up or log in"
      idPrefix={baseId}
      ease="move"
      duration={0.25}
    />
  );

  return (
    <AnimatedSize
      axis="height"
      ease="layout"
      className="m-auto w-full max-w-xl shrink-0 2xl:max-w-2xl"
    >
      {tab === "login" ? (
        <LoginPanel
          tabs={tabs}
          panel={{ id: `${baseId}-panel-login`, labelledBy: `${baseId}-tab-login` }}
          onCreateAccount={() => setTab("register")}
        />
      ) : (
        <RegisterPanel
          tabs={tabs}
          role={role}
          onRoleChange={setRole}
          onLogIn={() => setTab("login")}
          panel={{ id: `${baseId}-panel-register`, labelledBy: `${baseId}-tab-register` }}
        />
      )}
    </AnimatedSize>
  );
}
