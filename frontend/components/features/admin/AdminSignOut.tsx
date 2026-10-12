"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/hooks/use-auth-mutations";
import { ROUTES } from "@/lib/constants/routes";

export function AdminSignOut({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const logout = useLogoutMutation();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={logout.isPending}
      onClick={() => {
        logout.mutate(undefined, {
          onSettled: () => {
            router.push(ROUTES.admin);
            router.refresh();
          },
        });
      }}
    >
      {logout.isPending ? "Signing out…" : "Log out"}
    </Button>
  );
}
