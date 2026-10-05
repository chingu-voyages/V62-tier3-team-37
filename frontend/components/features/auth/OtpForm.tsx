"use client";

import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { inlineLinkClassName } from "@/components/ui/inline-link";
import {
  useLogoutMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api/client";
import { signupJourneySteps } from "@/lib/auth/journey";
import { ROUTES } from "@/lib/constants/routes";
import { applyOtpInput, OTP_LENGTH, sanitizeOtpDigits } from "@/lib/validation/otp";
import { useAuthStore } from "@/store/use-auth-store";
import { AuthCard } from "./AuthCard";

/**
 * Email verification screen at /auth/otp.
 *
 * Renders six single-character inputs. Typing accepts digits only and advances
 * focus; Backspace on an empty box returns to the previous one. A pasted or
 * SMS-autofilled code lands all six digits at once, and focusing a filled box
 * selects it so retyping corrects that position instead of shifting the rest.
 *
 * "Verify" posts to `/email/otp/verify`, "Resend code" to
 * `/email/otp/resend`, and all three actions are disabled while in flight.
 */
export function OtpForm() {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const email = useAuthStore((state) => state.signup.email);
  const role = useAuthStore((state) => state.signup.role);
  const clearSignup = useAuthStore((state) => state.clearSignup);

  const router = useRouter();
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();
  const logoutMutation = useLogoutMutation();

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Logout is a third in-flight action; it must disable the form too.
  const busy = verifyMutation.isPending || resendMutation.isPending || logoutMutation.isPending;
  const code = digits.join("");
  const complete = code.length === OTP_LENGTH;

  useEffect(() => {
    if (!email) router.replace(ROUTES.auth);
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * Select the box's digit on focus.
   *
   * This is what makes the single input able to receive a whole code. With the
   * contents selected, anything typed replaces the selection, so `onChange` only
   * ever sees either one character (a keystroke) or the entire pasted string - never
   * "the old digit plus the new one". Without the selection, retyping a box produced
   * a two-character value that got spread across the grid, so correcting digit 3
   * silently shifted digits 4-6 and produced a code the user never entered.
   */
  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    event.currentTarget.select();
  }

  /** Bulk arrival - paste or SMS autofill - always fills from the first box. */
  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    if (sanitizeOtpDigits(pasted).length === 0) return;

    const { digits: next, focusIndex } = applyOtpInput(digits, 0, pasted);
    setDigits(next);
    inputRefs.current[focusIndex]?.focus();
  }

  function handleChange(index: number, value: string) {
    const { digits: next, focusIndex } = applyOtpInput(digits, index, value);
    setDigits(next);

    if (focusIndex !== index) {
      inputRefs.current[focusIndex]?.focus();
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
          if (!mounted.current) return;
          setNotice(response.message ?? "Email verified successfully.");
          router.push(role === "HCP" ? ROUTES.hcpVerification : ROUTES.home);
        },
        onError: (error) => {
          if (!mounted.current) return;
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
        if (!mounted.current) return;
        setNotice(response.message ?? "A new verification code has been sent.");
      },
      onError: (error) => {
        if (!mounted.current) return;
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  function handleBackToSignIn() {
    if (logoutMutation.isPending) return;

    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearSignup();
        router.push(`${ROUTES.auth}?tab=login`);
      },
    });
  }

  return (
    <AuthCard
      step={{ current: 2, total: signupJourneySteps(role), detail: "Email code" }}
      title="Verify your email"
      subtitle={
        email
          ? `We sent a ${OTP_LENGTH}-digit code to ${email}. Enter it to open your account.`
          : `We sent a ${OTP_LENGTH}-digit code to your email. Enter it below to continue.`
      }
      info={
        <Callout>
          Codes are valid for 10 minutes. If you don&apos;t see the email, check your spam folder.
        </Callout>
      }
      footer={
        <button
          type="button"
          onClick={handleBackToSignIn}
          disabled={logoutMutation.isPending}
          className={inlineLinkClassName}
        >
          {logoutMutation.isPending ? "Logging out…" : "Back to sign in"}
        </button>
      }
    >
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleVerify();
        }}
      >
        <fieldset className="border-0 p-0">
          <legend className="sr-only">{OTP_LENGTH}-digit verification code</legend>
          <div className="mx-auto grid w-full max-w-sm grid-cols-6 gap-1.5 sm:gap-2.5">
            {digits.map((digit, index) => {
              const inputId = `otp-${index}`;
              const missing = !complete && index >= code.length;
              return (
                <input
                  key={inputId}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  id={inputId}
                  name={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                  required
                  aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  aria-invalid={missing && formError ? true : undefined}
                  aria-describedby={formError ? "otp-error" : undefined}
                  value={digit}
                  disabled={busy}
                  onFocus={handleFocus}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  className="aspect-square w-full max-w-12 justify-self-center rounded-md border border-input bg-card text-center font-heading type-h4 tabular-nums transition-[color,box-shadow] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15"
                />
              );
            })}
          </div>
        </fieldset>

        {formError ? (
          <Callout id="otp-error" tone="danger" role="alert">
            {formError}
          </Callout>
        ) : null}

        {notice ? (
          <Callout role="status" icon={CircleCheck}>
            {notice}
          </Callout>
        ) : null}

        <div className="flex flex-col">
          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={!complete || busy}
          >
            {verifyMutation.isPending ? "Verifying…" : "Verify"}
          </Button>
        </div>

        <p className="text-center type-body text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={busy}
            className={inlineLinkClassName}
          >
            {resendMutation.isPending ? "Resending…" : "Resend code"}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}
