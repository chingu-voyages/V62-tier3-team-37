import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { specialtyLabel, verificationLabel } from "@/lib/admin/clinician-labels";
import { userDisplayName } from "@/lib/auth/display";
import { ROUTES } from "@/lib/constants/routes";
import { getAdminClinicians } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";
import { cn } from "@/lib/utils";
import type { AdminClinicianSummary } from "@/types/admin";

export const metadata: Metadata = {
  title: "Clinicians",
  robots: { index: false, follow: false },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Needs a decision" },
  { id: "verified", label: "Confirmed" },
  { id: "blocked", label: "Blocked" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default async function AdminCliniciansPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const view = FILTERS.some((filter) => filter.id === params.view)
    ? (params.view as FilterId)
    : "all";
  const clinicians = (await getAdminClinicians()).filter((clinician) => matches(clinician, view));

  return (
    <AdminShell name={userDisplayName(user)} section="clinicians">
      <p className="type-step text-primary">Admin</p>
      <h1 className="mt-2 type-h1 text-foreground">Clinicians</h1>
      <p className="mt-2 max-w-xl type-body text-muted-foreground">
        Every healthcare account appears here after sign-up. Open one to check their identity.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter clinicians">
        {FILTERS.map((filter) => {
          const selected = filter.id === view;
          return (
            <Link
              key={filter.id}
              href={
                filter.id === "all"
                  ? ROUTES.adminClinicians
                  : `${ROUTES.adminClinicians}?view=${filter.id}`
              }
              role="tab"
              aria-selected={selected}
              className={cn(
                "rounded-full px-3 py-1.5 type-helper font-medium",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground ring-1 ring-border",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {clinicians.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
          <p className="type-body text-muted-foreground">
            {view === "all"
              ? "No clinicians have signed up yet."
              : "No clinicians match this view."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {clinicians.map((clinician) => {
            const blocked = clinician.status === "DISABLED";
            const name = [clinician.first_name, clinician.last_name].filter(Boolean).join(" ");
            return (
              <li key={clinician.id}>
                <Link
                  href={
                    view === "all"
                      ? `${ROUTES.adminClinicians}/${clinician.id}`
                      : `${ROUTES.adminClinicians}/${clinician.id}?from=${view}`
                  }
                  className="flex flex-col gap-3 rounded-2xl bg-background px-5 py-4 shadow-card ring-1 ring-border/70 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="type-h4 text-foreground">{name}</p>
                    <p className="mt-1 type-helper text-muted-foreground">
                      {clinician.specialty
                        ? `${specialtyLabel(clinician.specialty)}${clinician.city ? ` · ${clinician.city}` : ""}`
                        : "Credentials not submitted"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={verificationLabel(clinician.verification_status, blocked)}
                      blocked={blocked}
                    />
                    {clinician.reviews_count > 0 ? (
                      <span className="type-helper text-muted-foreground">
                        {clinician.reviews_count}{" "}
                        {clinician.reviews_count === 1 ? "review" : "reviews"}
                      </span>
                    ) : null}
                    {clinician.reports_count > 0 ? (
                      <span className="rounded-full bg-destructive/10 px-2.5 py-1 type-helper font-medium text-destructive">
                        {clinician.reports_count}{" "}
                        {clinician.reports_count === 1 ? "open report" : "open reports"}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}

function matches(clinician: AdminClinicianSummary, view: FilterId): boolean {
  const blocked = clinician.status === "DISABLED";
  if (view === "blocked") return blocked;
  if (view === "verified") return clinician.verification_status === "VERIFIED" && !blocked;
  if (view === "waiting") {
    return (
      !blocked &&
      (clinician.verification_status === null || clinician.verification_status === "UNDER_REVIEW")
    );
  }
  return true;
}

function StatusPill({ label, blocked }: { label: string; blocked: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 type-helper font-medium",
        blocked ? "bg-destructive/10 text-destructive" : "bg-accent text-primary",
      )}
    >
      {label}
    </span>
  );
}
