import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { userDisplayName } from "@/lib/auth/display";
import { ROUTES } from "@/lib/constants/routes";
import { getAdminDeskSummary } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";

export const metadata: Metadata = {
  title: "Admin home",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  const user = await requireAdmin();
  const summary = await getAdminDeskSummary();

  const cards = [
    {
      href: `${ROUTES.adminClinicians}?view=waiting`,
      count: summary.clinicians_waiting,
      label: "Clinician requests",
      detail: "Waiting for you to confirm or decline.",
    },
    {
      href: ROUTES.adminReports,
      count: summary.reports_open,
      label: "Open reports",
      detail: "Problems patients sent about a clinician.",
    },
    {
      href: ROUTES.adminRequests,
      count: summary.access_requests,
      label: "Access requests",
      detail: "People waiting to become an admin.",
    },
    {
      href: ROUTES.adminPatients,
      count: summary.patients,
      label: "Patients",
      detail: "Accounts you can block if needed.",
    },
  ];

  return (
    <AdminShell name={userDisplayName(user)} section="home">
      <p className="type-step text-primary">Admin</p>
      <h1 className="mt-2 type-h1 text-foreground">What needs you</h1>
      <p className="mt-2 max-w-xl type-body text-muted-foreground">
        Start with the queues. The directories are there when you need a specific person.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="flex h-full flex-col rounded-2xl bg-background px-5 py-5 shadow-card ring-1 ring-border/70 transition-colors hover:bg-accent/40"
            >
              <p className="type-h1 text-primary">{card.count}</p>
              <p className="mt-2 type-h4 text-foreground">{card.label}</p>
              <p className="mt-1 type-body text-muted-foreground">{card.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
