import type { ReactNode } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { Navbar } from "./Navbar";

export function AuthSplitShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-0 grid h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
      <AuthBrandPanel />

      <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
        <Navbar className="shrink-0" />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12 xl:px-10 2xl:px-14">
          {children}
        </main>
      </div>
    </div>
  );
}
