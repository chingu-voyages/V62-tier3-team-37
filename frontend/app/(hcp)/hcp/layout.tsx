import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { availableNavItems, hcpNavigation } from "@/lib/constants/navigation";
import { requireRole } from "@/lib/dal/auth";

/**
 * Authoritative guard for the whole HCP area.
 *
 * `proxy.ts` already redirects, but it caches `/api/user` for a few seconds and is
 * skipped for any matcher it does not cover, so it cannot be the only check on
 * routes that render a provider's profile. This re-reads the session per request;
 * `getOptionalUser` is memoised, so it costs the one call the page already needed.
 */
export default async function HcpAreaLayout({ children }: { children: ReactNode }) {
  await requireRole("HCP");

  return (
    <AppShell items={availableNavItems(hcpNavigation)} label="HCP navigation">
      {children}
    </AppShell>
  );
}
