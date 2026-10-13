"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRequestPasswordResetMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api/client";

type ForgotPasswordPanelProps = {
  /** Address typed into the login form, used to pre-fill the request. */
  email: string;
};

/**
 * "Forgot password?" disclosure shown beneath the login form.
 *
 * Split out of `LoginForm` so that screen stays a login form: this is a second,
 * independent action with its own pending and error state, and folding it in left
 * three extra `useState` calls interleaved with the sign-in fields.
 *
 * The server replies with the same message whether or not the address has an
 * account, so the confirmation copy never confirms that an email is registered.
 */
export function ForgotPasswordPanel({ email }: ForgotPasswordPanelProps) {
  const resetMutation = useRequestPasswordResetMutation();
  const [notice, setNotice] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  function handleSubmit() {
    if (!trimmedEmail || resetMutation.isPending) return;

    setNotice(null);
    resetMutation.mutate(trimmedEmail, {
      onSuccess: (response) => {
        // The API's message is intentionally vague; fall back rather than render nothing.
        setNotice(
          response.message ?? "If that address has an account, a reset link is on its way.",
        );
      },
      onError: (cause) => {
        setNotice(getApiErrorMessage(cause, "We could not send that link. Try again shortly."));
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
      <p className="type-body text-muted-foreground">
        We will email a reset link if this address has an account.
      </p>

      <Button
        type="button"
        variant="outline"
        disabled={!trimmedEmail || resetMutation.isPending}
        onClick={handleSubmit}
      >
        {resetMutation.isPending ? "Sending…" : "Send reset link"}
      </Button>

      {notice ? (
        <p className="type-helper text-foreground" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
