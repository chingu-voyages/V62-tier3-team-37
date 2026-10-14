import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { ReportActions } from "@/components/features/admin/QueueActions";
import { userDisplayName } from "@/lib/auth/display";
import { getAdminReports } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  const user = await requireAdmin();
  const reports = await getAdminReports();
  const open = reports.filter((report) => report.status === "OPEN");
  const closed = reports.filter((report) => report.status !== "OPEN");

  return (
    <AdminShell name={userDisplayName(user)} section="reports">
      <p className="type-step text-primary">Admin</p>
      <h1 className="mt-2 type-h1 text-foreground">Reports</h1>
      <p className="mt-2 max-w-xl type-body text-muted-foreground">
        Resolve a report when you have acted on it. Dismiss one that does not need a change.
      </p>

      {open.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
          <p className="type-body text-muted-foreground">No open reports.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {open.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <section className="mt-8">
          <h2 className="type-h3 text-foreground">Earlier</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {closed.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </ul>
        </section>
      ) : null}
    </AdminShell>
  );
}

function ReportCard({
  report,
}: {
  report: {
    id: number;
    clinician_id: number;
    clinician_name: string;
    reason: string;
    details: string | null;
    status: string;
    author: string;
    created_at: string | null;
  };
}) {
  return (
    <li className="rounded-2xl bg-background px-5 py-4 shadow-card ring-1 ring-border/70">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="type-h4 text-foreground">{report.reason}</p>
        <p className="type-helper text-muted-foreground">{formatDateTime(report.created_at) ?? ""}</p>
      </div>
      {report.details ? <p className="mt-2 type-body text-foreground">{report.details}</p> : null}
      <p className="mt-2 type-helper text-muted-foreground">
        {`${report.author || "Someone"} reported ${report.clinician_name || "a clinician"}`}
      </p>
      <Link href={`/admin/clinicians/${report.clinician_id}`} className="mt-2 inline-block type-helper font-medium text-primary">
        Open clinician
      </Link>
      <div className="mt-3">
        <ReportActions id={report.id} status={report.status} />
      </div>
    </li>
  );
}
