"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PasswordField } from "@/components/ui/text-field";
import { resetPassword } from "@/lib/api/auth-client";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import { passwordError } from "@/lib/validation/password";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    const passwordMessage = passwordError(password);
    if (passwordMessage) {
      setError(passwordMessage);
      return;
    }
    if (password !== confirmation) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
      router.push(`${ROUTES.auth}?tab=login`);
    } catch (cause) {
      setError(getApiFieldError(cause, "email") ?? getApiFieldError(cause, "password") ?? getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={email ? `For ${email}` : "Use the link from your email so we know which account this is."}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
        />
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmation}
          onChange={setConfirmation}
          required
        />
        {error ? <Callout tone="danger">{error}</Callout> : null}
        <Button type="submit" size="xl" disabled={pending || !email}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </AuthCard>
  );
}
