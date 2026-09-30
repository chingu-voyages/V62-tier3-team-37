import type { ReactNode } from "react";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";

/**
 * Step 3 of the signup journey reuses the same split shell as the earlier
 * steps, so the brand panel and the fixed-height form column stay identical
 * throughout onboarding.
 */
export default function HcpLayout({ children }: { children: ReactNode }) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
