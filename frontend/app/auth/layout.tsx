import type { ReactNode } from "react";
import { AuthLayoutClient } from "./auth-layout-client";

/**
 * Wraps the auth pages in AuthSplitShell with client-side guards.
 * A Suspense boundary is required because the client component calls
 * useSearchParams() during static generation.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
