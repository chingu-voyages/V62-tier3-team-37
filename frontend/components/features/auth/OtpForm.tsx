"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  useLogoutMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";

import { AuthCard } from "./AuthCard";

const OTP_LENGTH = 6;

/**
 * Email verification screen at /auth/otp.
 *
 * Renders six single-character inputs: typing only accepts digits and moves
 * focus to the next box; Backspace on an empty box returns to the previous
 * one.
 *
 * The page is only reachable when a signup email exists in the auth store —
 * otherwise the user is sent back to /auth. "Verify" posts the code to
 * `/email/otp/verify` and "Resend code" posts to `/email/otp/resend`. Both
 * actions disable the form while in flight and surface backend messages.
 */
export function OtpForm() {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const email = useAuthStore((state) => state.signup.email);
  const resetSignupContext = useAuthStore((state) => state.resetSignupContext);
  const router = useRouter();

  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();
  const logoutMutation = useLogoutMutation();

  const busy = verifyMutation.isPending || resendMutation.isPending;
  const loggingOut = logoutMutation.isPending;

  function handleBackToSignIn() {
    if (loggingOut) return;

    logoutMutation.mutate(undefined, {
      onSettled: () => {
        resetSignupContext();
        router.push("/auth");
      },
    });
  }

  useEffect(() => {
    if (!email) router.replace("/auth");
  }, [email, router]);

  useEffect(() => {
    const handlePopState = () => resetSignupContext();

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [resetSignupContext]);

  const code = digits.join("");
  const complete = code.length === OTP_LENGTH;

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit !== "" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerify() {
    if (!complete || busy) return;
    setFormError(null);
    setNotice(null);
    verifyMutation.mutate(
      { code },
      {
        onSuccess: (response) => {
          const message = response.message ?? "Email verified successfully.";
          console.log(message);
          setNotice(message);
        },
        onError: (error) => {
          setFormError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleResend() {
    if (busy) return;
    setFormError(null);
    setNotice(null);
    resendMutation.mutate(undefined, {
      onSuccess: (response) => {
        const message = response.message ?? "A new verification code has been sent.";
        setNotice(message);
      },
      onError: (error) => {
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a 6-digit code to your email. Enter it below to continue."
      info="Codes are valid for 10 minutes. If you don't see the email, check your spam folder."
      footer={
        <Link
          href="/auth"
          aria-disabled={loggingOut}
          onClick={(event) => {
            event.preventDefault();
            handleBackToSignIn();
          }}
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          {loggingOut ? "Logging out…" : "Back to sign in"}
        </Link>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleVerify();
        }}
      >
        <div className="flex justify-center gap-2">
          {digits.map((digit, index) => {
            const inputId = `otp-${index}`;
            return (
              <input
                key={inputId}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                id={inputId}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                aria-invalid={complete && digit === "" ? true : undefined}
                value={digit}
                disabled={busy}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="size-12 rounded-md border bg-background text-center text-h4 tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
              />
            );
          })}
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-md border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-center text-sm text-emerald-700 dark:text-emerald-400">
            {notice}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={!complete || busy}>
          {verifyMutation.isPending ? "Verifying…" : "Verify"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={busy}
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground disabled:opacity-60"
          >
            {resendMutation.isPending ? "Resending…" : "Resend code"}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}
