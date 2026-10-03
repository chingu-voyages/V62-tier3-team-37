import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { homePathForRole } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
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
    <main>
      <div className="flex min-h-dvh">
        <div className="flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6 flex justify-end">
            <Link href={ROUTES.auth} className={buttonVariants()}>
              Log in / Sign up
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Welcome to the Home Page</h1>
          <p className="mt-4 text-lg">This is a sample home page for the application.</p>
        </div>
      </div>
    </main>
  );
}
