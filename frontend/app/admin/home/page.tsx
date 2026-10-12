import type { Metadata } from "next";
import { AdminSignOut } from "@/components/features/admin/AdminSignOut";
import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { userDisplayName } from "@/lib/auth/display";
import { formatDateTime } from "@/lib/format";
import { getPendingAdminAccessRequests } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";

export const metadata: Metadata = {
  title: "Admin portal",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  const user = await requireAdmin();
  const requests = await getPendingAdminAccessRequests();
  const name = userDisplayName(user);

  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <header className="flex items-center justify-between gap-4 bg-background px-4 py-4 sm:px-6">
        <HealthHubLogo />
        <div className="flex items-center gap-3">
          <p className="hidden type-label text-foreground sm:block">{name}</p>
          <AdminSignOut />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        <p className="type-step text-primary">Admin</p>
        <h1 className="mt-2 type-h1 text-foreground">Portal</h1>
        <p className="mt-2 max-w-xl type-body text-muted-foreground">
          Signed in as {name}. These are the people waiting to become an admin.
        </p>

        {requests.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
            <p className="type-body text-muted-foreground">No one has asked to become an admin yet.</p>
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
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
