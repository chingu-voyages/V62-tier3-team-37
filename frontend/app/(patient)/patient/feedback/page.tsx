import type { Metadata } from "next";
import { PatientFeedbackForm } from "@/components/features/Patient/PatientFeedbackForm";
import { specialtyLabel } from "@/lib/admin/clinician-labels";
import { getFeedbackClinicians } from "@/lib/dal/feedback";

export const metadata: Metadata = {
  title: "Share feedback",
};

/**
 * Rate a clinician, or report one.
 *
 * The clinician list is read on the server so the page has something to render
 * on first paint; `getFeedbackClinicians` needs the session cookie, which only
 * `serverRequest` can send.
 */
export default async function PatientFeedbackPage() {
  const clinicians = await getFeedbackClinicians();

  return (
    <div className="flex w-full flex-col px-4 py-8 sm:px-6 lg:px-8">
      <p className="type-step text-primary">Your care</p>
      <h1 className="mt-2 type-h1 text-foreground">Share feedback</h1>
      <p className="mt-2 type-body text-muted-foreground">
        Rate a clinician the admin team has accepted, or report a problem.
      </p>

      {clinicians.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
          <p className="type-body text-muted-foreground">No accepted clinicians to review yet.</p>
        </div>
      ) : (
        <div className="mt-8 max-w-2xl">
          <PatientFeedbackForm
            clinicians={clinicians.map((clinician) => ({
              id: clinician.id,
              name: [clinician.first_name, clinician.last_name].filter(Boolean).join(" "),
              specialty: specialtyLabel(clinician.specialty),
            }))}
          />
        </div>
      )}
    </div>
  );
}
