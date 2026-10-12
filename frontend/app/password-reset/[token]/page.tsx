import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function PasswordResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { token } = await params;
  const { email } = await searchParams;

  return (
    <AuthSplitShell>
      <ResetPasswordForm token={token} email={email ?? ""} />
    </AuthSplitShell>
  );
}
