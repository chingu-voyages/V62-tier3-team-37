"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { AdminSignOut } from "@/components/features/admin/AdminSignOut";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { AnimatedSize, SlidingTabs } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { requestAdminAccess } from "@/lib/api/admin-client";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import { emailError } from "@/lib/validation/email";

type GateTab = "login" | "request";

type Account = {
  firstName: string;
  lastName: string;
  email: string;
};

const TABS: { value: GateTab; label: string }[] = [
  { value: "login", label: "Log in" },
  { value: "request", label: "Request access" },
];

/**
 * The admin sign-in screen.
 *
 * A signed-in non-admin sees only the request form — there is nothing to sign
 * into with an account that is not an admin yet. Everyone else gets the tab
 * strip.
 */
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

/**
 * The two ways in: sign in, or ask to be an admin.
 *
 * This is the same switcher the patient and clinician screen uses — `SlidingTabs`
 * for the pill that travels between options, `AnimatedSize` for the card
 * resizing as one form is replaced by the other. It had its own plain button row
 * with a hardcoded active class, which meant the admin gate looked nothing like
 * the screen visitors had just been redirected from.
 */
function GuestGate() {
  const [tab, setTab] = useState<GateTab>("login");
  const baseId = useId();

  return (
    <AnimatedSize
      axis="height"
      ease="layout"
      className="m-auto w-full max-w-xl shrink-0 2xl:max-w-2xl"
    >
      <AuthCard
        eyebrow="Admin"
        title={tab === "login" ? "Admin sign in" : "Request admin access"}
        subtitle={
          tab === "login"
            ? "Sign in with the email and password on your HealthHub account."
            : "Ask for an admin account. We keep the request until an admin reviews it."
        }
        tabs={
          <SlidingTabs
            items={TABS}
            value={tab}
            onChange={setTab}
            aria-label="Log in or request admin access"
            idPrefix={baseId}
            ease="move"
            duration={0.25}
          />
        }
      >
        {/* `SlidingTabs` points each tab at `${idPrefix}-panel-${value}`, so the
            panel has to carry that id or the tab is announced with no content
            behind it. */}
        <div role="tabpanel" id={`${baseId}-panel-${tab}`} aria-labelledby={`${baseId}-tab-${tab}`}>
          {tab === "login" ? (
            <AdminLoginForm />
          ) : (
            <RequestForm account={null} requestPending={false} />
          )}
        </div>
      </AuthCard>
    </AnimatedSize>
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
        // `/admin` is the gate, which redirects an admin on to the desk and
        // shows the request form to anyone else. Pushing the desk directly
        // would bounce a non-admin with no explanation.
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
        <Textarea
          id="admin-request-note"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="A short note for the person reviewing requests."
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
