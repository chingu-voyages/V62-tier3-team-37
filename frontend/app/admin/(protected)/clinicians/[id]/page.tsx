import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { ClinicianActions } from "@/components/features/admin/ClinicianActions";
import { CopyValue } from "@/components/features/admin/CopyValue";
import { OpenDocumentButton } from "@/components/features/admin/OpenDocumentButton";
import { ReportActions } from "@/components/features/admin/QueueActions";
import { userDisplayName } from "@/lib/auth/display";
import {
  documentLabel,
  genderLabel,
  NPI_REGISTRY_URL,
  specialtyLabel,
  verificationLabel,
} from "@/lib/admin/clinician-labels";
import { getAdminClinician } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { ApiError } from "@/lib/api/response";

export const metadata: Metadata = {
  title: "Clinician review",
  robots: { index: false, follow: false },
};

const LIST_VIEWS = ["waiting", "verified", "blocked"] as const;

export default async function AdminClinicianPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const { from } = await searchParams;
  const listView = LIST_VIEWS.find((view) => view === from);
  const backHref = listView ? `/admin/clinicians?view=${listView}` : "/admin/clinicians";

  let clinician;
  try {
    clinician = await getAdminClinician(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }

  const blocked = clinician.status === "DISABLED";
  const name = [clinician.first_name, clinician.last_name].filter(Boolean).join(" ");
  const canDecide = clinician.verification_status === "UNDER_REVIEW";
  const registryFields = [
    { label: "First name", value: clinician.first_name },
    { label: "Last name", value: clinician.last_name },
    clinician.city ? { label: "City", value: clinician.city } : null,
    clinician.specialty ? { label: "Specialty", value: specialtyLabel(clinician.specialty) } : null,
    clinician.medical_license_number
      ? { label: "License number", value: clinician.medical_license_number }
      : null,
  ].filter((field): field is { label: string; value: string } => field !== null);

  return (
    <AdminShell name={userDisplayName(user)} section="clinicians">
      <Link
        href={backHref}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md px-2.5 type-helper font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="type-step text-primary">Identity</p>
          <h1 className="mt-2 type-h1 text-foreground">{name}</h1>
          <p className="mt-2 type-body text-muted-foreground">
            {verificationLabel(clinician.verification_status, blocked)}
            {clinician.created_at ? ` · Joined ${formatDateTime(clinician.created_at)}` : ""}
          </p>
        </div>
      </div>

      {clinician.reports_count > 0 ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 type-body text-destructive">
          {clinician.reports_count === 1
            ? "1 report is open on this clinician."
            : `${clinician.reports_count} reports are open on this clinician.`}
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
          <h2 className="type-h3 text-foreground">Account</h2>
          <dl className="mt-3 divide-y divide-border/70">
            <Fact label="Email" value={clinician.email} />
            <Fact label="Phone" value={clinician.phone || "Not added"} />
            <Fact label="Date of birth" value={formatLongDate(clinician.birth_date) ?? "Not added"} />
            <Fact label="Gender" value={genderLabel(clinician.gender)} />
            <Fact label="Country" value={clinician.country || "Not added"} />
          </dl>

          <h2 className="mt-6 type-h3 text-foreground">Practice</h2>
          {clinician.specialty ? (
            <dl className="mt-3 divide-y divide-border/70">
              <Fact label="Specialty" value={specialtyLabel(clinician.specialty)} />
              <Fact
                label="Years in practice"
                value={
                  clinician.years_of_experience === null
                    ? "Not added"
                    : String(clinician.years_of_experience)
                }
              />
              <Fact label="License number" value={clinician.medical_license_number || "Not added"} />
              <Fact label="Issuing authority" value={clinician.license_issuing_authority || "Not added"} />
              <Fact label="Workplace" value={clinician.workplace_name || "Not added"} />
              <Fact label="City" value={clinician.city || "Not added"} />
            </dl>
          ) : (
            <p className="mt-3 type-body text-muted-foreground">
              This account exists. License details appear after the clinician submits verification.
            </p>
          )}

          {clinician.documents.length > 0 ? (
            <>
              <h2 className="mt-6 type-h3 text-foreground">Documents on file</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {clinician.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3">
                    <span className="type-body text-foreground">{documentLabel(document.type)}</span>
                    <OpenDocumentButton id={document.id} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {clinician.rejection_reason ? (
            <p className="mt-4 type-body text-muted-foreground">
              Last rejection: {clinician.rejection_reason}
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-accent p-5 ring-1 ring-secondary/20">
            <h2 className="type-h3 text-foreground">Check the NPI Registry</h2>
            <p className="mt-2 type-body text-muted-foreground">
              Open the registry, then enter the name and details from this account. The registry is
              the check for whether this person is a listed clinician.
            </p>
            <dl className="mt-3 divide-y divide-secondary/20">
              {registryFields.map((field) => (
                <CopyValue key={field.label} label={field.label} value={field.value} />
              ))}
            </dl>
            <a
              href={NPI_REGISTRY_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 type-label font-medium text-primary-foreground"
            >
              Open NPI Registry
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </section>

          <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
            <h2 className="type-h3 text-foreground">Decision</h2>
            <p className="mt-2 type-body text-muted-foreground">
              {blocked
                ? "This account is blocked. The clinician cannot sign in until you unblock them."
                : clinician.verification_status === "VERIFIED"
                  ? "You confirmed this request. The clinician sees Accepted on their profile."
                  : clinician.verification_status === "REJECTED"
                    ? "You declined this request. The clinician sees Declined on their profile."
                    : canDecide
                      ? "Confirm or decline this request. The clinician will see the result on their profile."
                      : "You can block this account at any time. A blocked clinician cannot sign in."}
            </p>
            <div className="mt-4">
              <ClinicianActions id={clinician.id} blocked={blocked} canDecide={canDecide} />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-4 rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Reviews</h2>
        {clinician.reviews.length === 0 ? (
          <p className="mt-3 type-body text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {clinician.reviews.map((review) => (
              <li key={review.id} className="border-b border-border/70 pb-3 last:border-b-0">
                <p className="type-label text-foreground">
                  {review.rating} of 5
                  {review.author ? ` · ${review.author}` : ""}
                </p>
                {review.comment ? <p className="mt-1 type-body text-foreground">{review.comment}</p> : null}
                <p className="mt-1 type-helper text-muted-foreground">
                  {formatDateTime(review.created_at) ?? ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Reports</h2>
        {clinician.reports.length === 0 ? (
          <p className="mt-3 type-body text-muted-foreground">No reports.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {clinician.reports.map((report) => (
              <li key={report.id} className="border-b border-border/70 pb-3 last:border-b-0">
                <p className="type-label text-foreground">{report.reason}</p>
                {report.details ? <p className="mt-1 type-body text-foreground">{report.details}</p> : null}
                <p className="mt-1 type-helper text-muted-foreground">
                  {[report.author, formatDateTime(report.created_at)].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3">
                  <ReportActions id={report.id} status={report.status ?? "OPEN"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="type-helper text-muted-foreground">{label}</dt>
      <dd className="text-right type-body text-foreground">{value}</dd>
    </div>
  );
}
