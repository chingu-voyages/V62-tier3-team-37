"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type AuthTab = "login" | "register";

const TABS: { value: AuthTab; label: string }[] = [
  { value: "register", label: "Sign up" },
  { value: "login", label: "Log in" },
];

export function AuthScreen() {
  const [tab, setTab] = useState<AuthTab>("register");

  const isLogin = tab === "login";

  const tabs = (
    <fieldset
      aria-label="Sign up or log in"
      className="grid grid-cols-2 gap-1 rounded-xl bg-accent p-1"
    >
      {TABS.map((t) => {
        const active = tab === t.value;
        return (
          <Button
            key={t.value}
            type="button"
            variant={active ? "default" : "ghost"}
            aria-pressed={active}
            onClick={() => setTab(t.value)}
            className="h-10 w-full rounded-lg px-3"
          >
            {t.label}
          </Button>
        );
      })}
    </fieldset>
  );

  if (isLogin) {
    return (
      <AuthCard
        title="Welcome back"
        subtitle="Log in to access your patient portal and continue your health journey."
        tabs={tabs}
      >
        <LoginForm />
      </AuthCard>
    );
  }

  return <RegisterForm tabs={tabs} />;
}
