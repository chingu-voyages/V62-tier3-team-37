import { redirect } from "next/navigation";
import { LandingContinue } from "@/components/features/landing/LandingContinue";
import { LandingHeader } from "@/components/features/landing/LandingHeader";
import { LandingSearch } from "@/components/features/landing/LandingSearch";
import { homePathForRole } from "@/lib/auth/permissions";
import { getOptionalUser } from "@/lib/dal/auth";

/**
 * Entry point.
 *
 * Authenticated visitors are forwarded to their area by the server, which knows
 * the real role. Previously the client decided this after login and hardcoded
 * `/patient/search`, so every HCP landed in the patient directory until they
 * clicked their way out.
 */
export default async function HomePage() {
  const user = await getOptionalUser();

  if (user) {
    redirect(homePathForRole(user.role));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <LandingHeader />
      <main className="flex w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <LandingSearch />
        </div>
        <LandingContinue />
      </main>
    </div>
  );
}
