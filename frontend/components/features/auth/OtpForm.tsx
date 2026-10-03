"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  useLogoutMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";

import { AuthCard } from "./AuthCard";

const OTP_LENGTH = 6;

const LINK_CLASS =
  "rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/85 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

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
  const role = useAuthStore((state) => state.signup.role);
  const setOtpVerified = useAuthStore((state) => state.setOtpVerified);
  const clearSignup = useAuthStore((state) => state.clearSignup);
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
        clearSignup();
        router.push("/auth");
      },
    });
  }

  useEffect(() => {
    if (!email) router.replace("/auth");
  }, [email, router]);

  useEffect(() => {
    const handlePopState = () => clearSignup();

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [clearSignup]);

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
          setNotice(message);
          setOtpVerified(true);
          if (role === "HCP") {
            router.push("/auth/hcp/verification");
          } else {
            router.push("/patient/search");
          }
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
      step={{ current: 2, total: 3, role: role ?? undefined }}
      title="Verify your email"
      subtitle="We sent a 6-digit code to your email. Enter it below to continue."
      info={
        <Callout>
          Codes are valid for 10 minutes. If you don&apos;t see the email, check your spam folder.
        </Callout>
      }
      footer={
        <Link
          href="/auth"
          aria-disabled={loggingOut}
          onClick={(event) => {
            event.preventDefault();
            handleBackToSignIn();
          }}
          className={LINK_CLASS}
        >
          {loggingOut ? "Logging out…" : "Back to sign in"}
        </Link>
      }
    >
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleVerify();
        }}
      >
        <div className="mx-auto grid w-full max-w-sm grid-cols-6 gap-1.5 sm:gap-2.5">
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
                className="aspect-square w-full max-w-12 justify-self-center rounded-md border border-input bg-card text-center font-heading type-h4 tabular-nums transition-[color,box-shadow] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15"
              />
            );
          })}
        </div>

        {formError ? (
          <Callout tone="danger" role="alert">
            {formError}
          </Callout>
        ) : null}

        {notice ? (
          <Callout role="status" icon={CircleCheck}>
            {notice}
          </Callout>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="submit"
            size="xl"
            className="w-full sm:w-auto sm:min-w-48"
            disabled={!complete || busy}
          >
            {verifyMutation.isPending ? "Verifying…" : "Verify"}
          </Button>
        </div>

        <p className="text-center type-body text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button type="button" onClick={handleResend} disabled={busy} className={LINK_CLASS}>
            {resendMutation.isPending ? "Resending…" : "Resend code"}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}
