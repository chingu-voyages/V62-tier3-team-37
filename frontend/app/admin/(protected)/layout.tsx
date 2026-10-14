import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/dal/auth";

/**
 * Authoritative guard for the admin desk.
 *
 * `proxy.ts` already redirects, but it caches `/api/user` for a few seconds and is
 * skipped for any matcher it does not cover, so it cannot be the only check.
 * This re-reads the session per request. The sign-in screen stays in `(gate)`.
 */
export default async function AdminDeskLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return children;
}
