"use client";

import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedOTPInput } from "@/components/ui/animated-o-t-p-input";
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
import { OTP_LENGTH } from "@/lib/validation/otp";
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
 * Verification posts to `/email/otp/verify` automatically once the sixth
 * digit lands (via the input's onComplete), and "Resend code" posts to
 * `/email/otp/resend`. All actions are disabled while in flight.
 */
export function OtpForm() {
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const busy = verifyMutation.isPending || resendMutation.isPending || logoutMutation.isPending;

  useEffect(() => {
    if (!email) router.replace(ROUTES.auth);
  }, [email, router]);

  function handleVerify(value: string) {
    if (value.length !== OTP_LENGTH || busy) return;
    setFormError(null);
    setNotice(null);

    verifyMutation.mutate(
      { code: value },
      {
        onSuccess: (response) => {
          if (!mounted.current) return;
          setNotice(response.message ?? "Email verified successfully.");
          router.push(role === "HCP" ? ROUTES.hcpVerification : ROUTES.patientHome);
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
          handleVerify(code);
        }}
      >
        <fieldset className="border-0 p-0">
          <legend className="sr-only">{OTP_LENGTH}-digit verification code</legend>
          <div className="flex justify-center">
            <AnimatedOTPInput
              maxLength={OTP_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              aria-label={`${OTP_LENGTH}-digit verification code`}
              aria-describedby={formError ? "otp-error" : undefined}
              disabled={busy}
            />
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

        {verifyMutation.isPending ? (
          <p className="text-center type-body text-muted-foreground" role="status">
            Verifying…
          </p>
        ) : null}

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
