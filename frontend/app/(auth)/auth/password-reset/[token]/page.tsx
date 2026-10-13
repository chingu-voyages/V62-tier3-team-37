import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

/**
 * New-password screen reached from the link in a reset email.
 *
 * Laravel's broker sends the user here with `?token=…&email=…`. The path
 * segment is kept for a stable, shareable URL and the query string carries the
 * two values the endpoint actually needs.
 *
 * No `requireUser()` here: the reset endpoints are `guest`-only, so requiring a
 * session would lock out exactly the people who need this page.
 */
export default async function PasswordResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const [{ token }, { email }] = await Promise.all([params, searchParams]);

  return <ResetPasswordForm token={token} email={email ?? ""} />;
}
