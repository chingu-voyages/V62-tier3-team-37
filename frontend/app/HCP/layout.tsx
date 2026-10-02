import type { ReactNode } from "react";
import { HcpAsideLayout } from "@/layouts/Hcp";

import { MainLayout } from "@/layouts/Patient";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <HcpAsideLayout />
      <MainLayout>{children}</MainLayout>
    </div>
  );
}
