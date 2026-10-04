"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SignupRole } from "@/types/auth";
import { AuthCard } from "./AuthCard";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { SignupRoleSwitch } from "./SignupRoleSwitch";

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
    <div
      role="tablist"
      aria-label="Sign up or log in"
      className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
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
            variant="ghost"
            onClick={() => setTab(option.value)}
            className={cn(
              "h-10 w-full rounded-lg px-3 shadow-none",
              selected
                ? "bg-card text-foreground shadow-soft hover:bg-card hover:text-foreground"
                : "text-muted-foreground hover:bg-transparent hover:text-foreground",
            )}
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
        subtitle={
          <div className="flex flex-col gap-2">
            <SignupRoleSwitch role={role} onRoleChange={setRole} />
            <p>Log in with the email and password you used to create your account.</p>
          </div>
        }
        tabs={tabs}
      >
        <div role="tabpanel" id={`${baseId}-panel-login`} aria-labelledby={`${baseId}-tab-login`}>
          <LoginForm onCreateAccount={() => setTab("register")} />
        </div>
      </AuthCard>
    );
  }

  return (
    <RegisterForm tabs={tabs} role={role} onRoleChange={setRole} onLogIn={() => setTab("login")} />
  );
}
