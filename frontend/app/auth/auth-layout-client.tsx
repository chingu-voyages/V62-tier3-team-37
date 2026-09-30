"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

import { AuthSplitShell } from "@/components/layout/AuthSplitShell";
import { useAuthStore } from "@/store/use-auth-store";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const signup = useAuthStore((state) => state.signup);
  const otpVerified = useAuthStore((state) => state.otpVerified);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");

    if (message === "otp_incomplete" && pathname === "/auth") {
      toast.info(
        "OTP verification was not completed. Please verify your email first and try again.",
      );
      router.replace("/auth");
      return;
    }

    if (pathname === "/auth") return;

    if (!signup.email) {
      router.replace("/auth");
      return;
    }

    if (pathname.startsWith("/auth/hcp")) {
      if (signup.role !== "HCP") {
        router.replace("/patient/home");
        return;
      }
      if (!otpVerified) {
        router.replace("/auth?message=otp_incomplete");
      }
    }
  }, [signup, otpVerified, pathname, searchParams, router]);

  return <AuthSplitShell>{children}</AuthSplitShell>;
}

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
