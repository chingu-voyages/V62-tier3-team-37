import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";

export const metadata: Metadata = {
  title: { default: "Sign in or sign up", template: "%s | HealthHub" },

  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
