import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminGate } from "@/components/features/admin/AdminGate";
import { userFirstName, userLastName } from "@/lib/auth/display";
import { ADMIN_ROLE } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import { getMyAdminAccessRequest } from "@/lib/dal/admin";
import { getOptionalUser } from "@/lib/dal/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminGatePage() {
  const user = await getOptionalUser();

  if (user?.role === ADMIN_ROLE) {
    redirect(ROUTES.adminHome);
  }

  const existing = user ? await getMyAdminAccessRequest() : null;

  return (
    <AdminGate
      account={
        user
          ? {
              firstName: userFirstName(user),
              lastName: userLastName(user),
              email: user.email?.trim() || "",
            }
          : null
      }
      requestPending={existing?.status === "PENDING"}
    />
  );
}
