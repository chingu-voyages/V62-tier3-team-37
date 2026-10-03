import type { Metadata } from "next";
import { AuthScreen } from "@/components/features/auth/AuthScreen";
import { requireGuest } from "@/lib/dal/auth";

export const metadata: Metadata = {
  title: "Sign in or sign up",
  robots: { index: false, follow: false },
};

/**
 * The single login/register screen.
 *
 * The tab switch ("Sign up" / "Log in") is local UI state handled inside
 * `AuthScreen` - no URL change, no route change.
 *
 * The guard lives on the page rather than on the `(auth)` layout because that
 * layout also wraps `/auth/otp` and `/auth/hcp/verification`, which require a
 * session instead of forbidding one.
 */
export default async function AuthPage() {
  await requireGuest();

  return <AuthScreen />;
}
