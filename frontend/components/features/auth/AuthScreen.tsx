"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {TABS.map((t) => {
        const active = tab === t.value;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  if (isLogin) {
    return (
      <AuthCard
        title="Welcome back"
        subtitle="Log in to access your patient portal and continue your health journey."
        tabs={tabs}
        info=""
      >
        <LoginForm />
      </AuthCard>
    );
  }

  return <RegisterForm tabs={tabs} />;
}
