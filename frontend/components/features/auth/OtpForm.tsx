"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { AuthCard } from "./AuthCard";

const OTP_LENGTH = 6;

/**
 * UI-only email verification screen at /auth/otp.
 *
 * Renders six single-character inputs: typing only accepts digits and moves
 * focus to the next box; Backspace on an empty box returns to the previous
 * one. "Verify" and "Resend" are deliberately inert — Verify logs the code it
 * would send once real OTP delivery exists, and Resend only logs a request.
 * Component is structured so an API call can replace the console boundary.
 */
export function OtpForm() {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [verifying, setVerifying] = useState(false);

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

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a 6-digit code to your email. Enter it below to continue."
      info="Codes are valid for 10 minutes. If you don't see the email, check your spam folder."
      footer={
        <Link
          href="/auth"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          Back to sign in
        </Link>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!complete) return;
          setVerifying(true);
          // Development boundary: no OTP delivery exists, so the code is only
          // logged once real delivery lands.
          console.info("Verify code", code);
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
                disabled={verifying}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="size-12 rounded-md border bg-background text-center text-h4 tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
              />
            );
          })}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={!complete}>
          {verifying ? "Verifying…" : "Verify"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={() => {
              // Development boundary: no OTP delivery exists, UI-only.
              console.info("Resend OTP requested");
            }}
            disabled={verifying}
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            Resend code
          </button>
        </p>
      </form>
    </AuthCard>
  );
}
