import type { ReactNode } from "react";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";

export default function AdminGateLayout({ children }: { children: ReactNode }) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
