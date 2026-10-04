"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const baseId = useId();

  const tabs = (
    <div
      role="tablist"
      aria-label="Sign up or log in"
      className="grid grid-cols-2 gap-1 rounded-xl bg-accent p-1"
    >
      {TABS.map((option) => {
        const selected = tab === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            role="tab"
            id={`${baseId}-tab-${option.value}`}
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${option.value}`}
            // Only the selected tab is in the tab order; arrow keys move between them.
            tabIndex={selected ? 0 : -1}
            variant={selected ? "default" : "ghost"}
            onClick={() => setTab(option.value)}
            className="h-10 w-full rounded-lg px-3"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );

  if (tab === "login") {
    return (
      <AuthCard
        title="Welcome back"
        subtitle="Log in to access your patient portal and continue your health journey."
        tabs={tabs}
      >
        <div role="tabpanel" id={`${baseId}-panel-login`} aria-labelledby={`${baseId}-tab-login`}>
          <LoginForm />
        </div>
      </AuthCard>
    );
  }

  return <RegisterForm tabs={tabs} initialRole={initialRole} />;
}
