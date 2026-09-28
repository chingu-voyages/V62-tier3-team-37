import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function HcpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>
      <Footer />
    </div>
  );
}
