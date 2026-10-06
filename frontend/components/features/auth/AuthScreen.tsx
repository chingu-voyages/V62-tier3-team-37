"use client";

import { useId, useState } from "react";
import { AnimatedSize, SlidingTabs } from "@/components/motion";
import type { SignupRole } from "@/types/auth";
import { AuthCard } from "./AuthCard";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type AuthTab = "login" | "register";

type AuthScreenProps = {
  initialTab?: AuthTab;
  initialRole?: SignupRole;
};

const TABS: { value: AuthTab; label: string }[] = [
  { value: "register", label: "Sign up" },
  { value: "login", label: "Log in" },
];

export function AuthScreen({ initialTab = "register", initialRole = "PATIENT" }: AuthScreenProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [role, setRole] = useState<SignupRole>(initialRole);
  const baseId = useId();

  const tabs = (
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
        <AuthCard
          title="Welcome back"
          subtitle={
            <div className="flex flex-col gap-2">
              <p>Log in with the email and password you used to create your account.</p>
            </div>
          }
          tabs={tabs}
        >
          <div role="tabpanel" id={`${baseId}-panel-login`} aria-labelledby={`${baseId}-tab-login`}>
            <LoginForm onCreateAccount={() => setTab("register")} />
          </div>
        </AuthCard>
      ) : (
        <RegisterForm
          tabs={tabs}
          role={role}
          onRoleChange={setRole}
          onLogIn={() => setTab("login")}
        />
      )}
    </AnimatedSize>
  );
}
