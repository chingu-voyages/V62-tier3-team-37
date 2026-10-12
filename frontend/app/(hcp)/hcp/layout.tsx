import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { availableNavItems, hcpNavigation } from "@/lib/constants/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { requireRole } from "@/lib/dal/auth";
import { getHcpVerificationSummary } from "@/lib/dal/hcp";

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

  let accepted = false;
  try {
    accepted = (await getHcpVerificationSummary()).requestDecision === "accepted";
  } catch {
    accepted = false;
  }

  const items = availableNavItems(hcpNavigation).filter(
    (item) => accepted || item.href !== ROUTES.hcpToday,
  );

  return (
    <AppShell items={items} label="HCP navigation" floatingNav wide>
      {children}
    </AppShell>
  );
}
