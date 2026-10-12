import type { Metadata } from "next";
import { AccessRequestActions } from "@/components/features/admin/AccessRequestActions";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { userDisplayName } from "@/lib/auth/display";
import { getPendingAdminAccessRequests } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Access requests",
  robots: { index: false, follow: false },
};

export default async function AdminRequestsPage() {
  const user = await requireAdmin();
  const requests = await getPendingAdminAccessRequests();

  return (
    <AdminShell name={userDisplayName(user)} section="requests">
      <p className="type-step text-primary">Admin</p>
      <h1 className="mt-2 type-h1 text-foreground">Access requests</h1>
      <p className="mt-2 max-w-xl type-body text-muted-foreground">
        Approve gives that account the admin role. Decline leaves their role unchanged.
      </p>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
          <p className="type-body text-muted-foreground">
            No one has asked to become an admin yet.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {requests.map((request) => {
            const fullName = [request.first_name, request.last_name].filter(Boolean).join(" ");
            return (
              <li
                key={request.id}
                className="rounded-2xl bg-background px-5 py-4 shadow-card ring-1 ring-border/70"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="type-h4 text-foreground">{fullName || request.email}</p>
                  <p className="type-helper text-muted-foreground">
                    {formatDateTime(request.created_at) ?? "Waiting"}
                  </p>
                </div>
                <p className="mt-1 type-helper text-muted-foreground">{request.email}</p>
                {request.message ? (
                  <p className="mt-3 type-body text-foreground">{request.message}</p>
                ) : null}
                <AccessRequestActions id={request.id} />
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
