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
 * The tab switch ("Sign up" / "Log in") is local UI state inside `AuthScreen`.
 * `?tab=login` and `?role=HCP` only set the first view, for links from the landing page.
 *
 * The guard lives on the page rather than on the `(auth)` layout because that
 * layout also wraps `/auth/otp` and `/auth/hcp/verification`, which require a
 * session instead of forbidding one.
 */
type AuthPageProps = {
  searchParams: Promise<{ tab?: string; role?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  await requireGuest();
  const params = await searchParams;

  return (
    <AuthScreen
      initialTab={params.tab === "login" ? "login" : "register"}
      initialRole={params.role === "HCP" ? "HCP" : "PATIENT"}
    />
  );
}
