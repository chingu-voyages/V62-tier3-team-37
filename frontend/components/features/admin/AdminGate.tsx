"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AdminSignOut } from "@/components/features/admin/AdminSignOut";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { requestAdminAccess } from "@/lib/api/admin-client";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { emailError } from "@/lib/validation/email";

type GateTab = "login" | "request";

type Account = {
  firstName: string;
  lastName: string;
  email: string;
};

export function AdminGate({
  account,
  requestPending,
}: {
  account: Account | null;
  requestPending: boolean;
}) {
  if (account) {
    return (
      <AuthCard
        eyebrow="Admin"
        title="Request admin access"
        subtitle={`You are signed in as ${account.firstName || account.email}. This account is not an admin yet.`}
      >
        <RequestForm account={account} requestPending={requestPending} />
        <AdminSignOut variant="ghost" className="mt-3 w-full" />
      </AuthCard>
    );
  }

  return <GuestGate />;
}

function GuestGate() {
  const [tab, setTab] = useState<GateTab>("login");

  return (
    <AuthCard
      eyebrow="Admin"
      title={tab === "login" ? "Admin sign in" : "Request admin access"}
      subtitle={
        tab === "login"
          ? "Sign in with the email and password on your HealthHub account."
          : "Ask for an admin account. We keep the request until an admin reviews it."
      }
      tabs={
        <div role="tablist" aria-label="Sign in or request access" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          <TabButton selected={tab === "login"} onClick={() => setTab("login")}>
            Log in
          </TabButton>
          <TabButton selected={tab === "request"} onClick={() => setTab("request")}>
            Request access
          </TabButton>
        </div>
      }
    >
      {tab === "login" ? <AdminLoginForm /> : <RequestForm account={null} requestPending={false} />}
    </AuthCard>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button
      type="button"
      role="tab"
      aria-selected={selected}
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-10 w-full rounded-lg px-3 shadow-none",
        selected
          ? "bg-card text-foreground shadow-soft hover:bg-card hover:text-foreground"
          : "text-muted-foreground hover:bg-transparent hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function AdminLoginForm() {
  const login = useLoginMutation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailMessage = emailError(email);
    const passwordMessage = password.length === 0 ? "Password is required" : undefined;
    setFieldErrors({ email: emailMessage, password: passwordMessage });
    if (emailMessage || passwordMessage) return;

    setError(null);
    login.mutate(
      { email: email.trim(), password, remember: false },
      {
        onSuccess: () => {
          router.push(ROUTES.admin);
          router.refresh();
        },
        onError: (cause) => {
          setFieldErrors({
            email: getApiFieldError(cause, "email"),
            password: getApiFieldError(cause, "password"),
          });
          setError(getApiErrorMessage(cause, "Invalid email or password."));
        },
      },
    );
  }

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="Enter your email"
        required
        value={email}
        error={fieldErrors.email}
        onChange={setEmail}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        required
        value={password}
        error={fieldErrors.password}
        onChange={setPassword}
      />
      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}
      <Button type="submit" size="xl" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

function RequestForm({
  account,
  requestPending,
}: {
  account: Account | null;
  requestPending: boolean;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(account?.firstName ?? "");
  const [lastName, setLastName] = useState(account?.lastName ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(requestPending);

  if (sent) {
    return (
      <Callout title="Request sent" role="status">
        We have your request. An admin will review it before this account can open the portal.
      </Callout>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailMessage = emailError(email);
    if (!firstName.trim() || !lastName.trim() || emailMessage) {
      setFieldError(emailMessage ?? "Enter your name and email.");
      return;
    }

    setPending(true);
    setError(null);
    setFieldError(undefined);
    try {
      await requestAdminAccess({ firstName, lastName, email, message });
      setSent(true);
      router.refresh();
    } catch (cause) {
      setFieldError(getApiFieldError(cause, "email"));
      setError(getApiErrorMessage(cause, "We could not send that request."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          value={firstName}
          onChange={setFirstName}
          required
          readOnly={account !== null}
          disabled={account !== null}
        />
        <TextField
          label="Last name"
          value={lastName}
          onChange={setLastName}
          required
          readOnly={account !== null}
          disabled={account !== null}
        />
      </div>
      <TextField
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        required
        readOnly={account !== null}
        disabled={account !== null}
        error={fieldError}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-request-note">
          Why you need access
          <span className="ml-2 font-normal text-muted-foreground">Optional</span>
        </Label>
        <textarea
          id="admin-request-note"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="A short note for the person reviewing requests."
          className="w-full resize-y rounded-md border border-input bg-card px-3.5 py-2.5 type-body text-foreground outline-none placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        />
      </div>
      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
