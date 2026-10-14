import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/layout/AuthBrandPanel";
import { Navbar } from "@/components/layout/Navbar";
import { getOptionalUser } from "@/lib/dal/auth";

type AuthSplitShellProps = {
  children: ReactNode;
  /** Auth screens leave the name and avatar off the bar. */
  hideIdentity?: boolean;
};

/**
 * Split shell for auth, password reset, and the admin sign-in gate.
 *
 * A signed-out visitor sees only the language control. A signed-in visitor on the
 * admin gate sees their name. Auth screens pass `hideIdentity` so the bar stays
 * clear while the account is still being confirmed.
 */
export async function AuthSplitShell({ children, hideIdentity = false }: AuthSplitShellProps) {
  const user = hideIdentity ? null : await getOptionalUser();

  return (
    <div className="fixed inset-x-0 top-0 grid h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
      <AuthBrandPanel />

      <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
        <Navbar user={user} variant={user ? "pending" : "guest"} className="shrink-0" />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12 xl:px-10 2xl:px-14">
          {children}
        </main>
      </div>
    </div>
  );
}
