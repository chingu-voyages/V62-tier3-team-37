import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/**
 * Shared shell for the auth screens (/auth + /auth/otp).
 *
 * Stack:
 *    1. `Navbar` pinned to the top of a min-h-dvh column
 *    2. a full-height `<main>` that centres its child both ways — this is
 *       where the auth cards sit
 *    3. `Footer` pinned to the bottom
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
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
