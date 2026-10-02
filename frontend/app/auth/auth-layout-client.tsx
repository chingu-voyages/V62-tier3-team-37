"use client";
import { Suspense } from "react";
import { AuthSplitShell } from "@/components/layout/AuthSplitShell";

// function AuthGuard({ children }: { children: React.ReactNode }) {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     if (searchParams.get("message") === "otp_incomplete" && pathname === "/auth") {
//       toast.info("OTP verification was not completed. Please verify your email first.");
//       router.replace("/auth");
//     }
//   }, [searchParams, pathname, router]);

//   return <AuthSplitShell>{children}</AuthSplitShell>;
// }

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AuthSplitShell>{children}</AuthSplitShell>
    </Suspense>
  );
}
