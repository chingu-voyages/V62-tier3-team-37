import type { Metadata } from "next";
import { OtpForm } from "@/components/features/auth/OtpForm";
import { requireUser } from "@/lib/dal/auth";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

/**
 * Email verification screen. Posts to `/email/otp/verify` and
 * `/email/otp/resend`.
 *
 * Verification is deliberately *not* required here - this is the screen that
 * resolves it - but a session is, because the OTP endpoints are authenticated.
 */
export default async function OtpPage() {
  await requireUser();

  return <OtpForm />;
}
