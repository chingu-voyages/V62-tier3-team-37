"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PasswordField } from "@/components/ui/text-field";
import { useResetPasswordMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import { passwordError } from "@/lib/validation/password";
import { PasswordPolicyHint } from "./PasswordPolicyHint";

type ResetPasswordFormProps = {
  /** The `token` path segment from the emailed link. */
  token: string;
  /** The `email` query string the link carries; the server requires both. */
  email: string;
};

/**
 * New-password screen at /auth/password-reset/[token].
 *
 * Both `token` and `email` come from the emailed link because Laravel's reset
 * broker needs the two together to look the user up. A link opened without an
 * email has nothing to post, so the form cannot submit and says why.
 *
 * The policy check runs locally through `passwordError` before posting, which
 * mirrors the server's `Password::min(8)->mixedCase()->numbers()->symbols()`
 * rule and keeps an obviously invalid password from making a round trip.
 */
export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const resetMutation = useResetPasswordMutation();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(email) && !resetMutation.isPending;

  function handleSubmit() {
    const policyMessage = passwordError(password);
    if (policyMessage) {
      setError(policyMessage);
      return;
    }

    if (password !== confirmation) {
      setError("Those passwords do not match.");
      return;
    }

    setError(null);
    resetMutation.mutate(
      { token, email, password, password_confirmation: confirmation },
      {
        onSuccess: () => {
          // The old session is gone, so send them back to sign in rather than
          // leaving them on a page they can no longer use.
          router.push(`${ROUTES.auth}?tab=login`);
        },
        onError: (cause) => {
          setError(
            getApiFieldError(cause, "email") ??
              getApiFieldError(cause, "password") ??
              getApiErrorMessage(cause, "That reset link is no longer valid. Request a new one."),
          );
        },
      },
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={
        email
          ? `For ${email}`
          : "This link is missing its email address. Request a new link from the sign-in screen."
      }
    >
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (error) setError(null);
          }}
          required
        />

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmation}
          error={
            confirmation.length > 0 && confirmation !== password
              ? "Passwords do not match."
              : undefined
          }
          onChange={(value) => {
            setConfirmation(value);
            if (error) setError(null);
          }}
          required
        />

        <PasswordPolicyHint value={password} />

        {error ? (
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        ) : null}

        <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
          {resetMutation.isPending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </AuthCard>
  );
}
