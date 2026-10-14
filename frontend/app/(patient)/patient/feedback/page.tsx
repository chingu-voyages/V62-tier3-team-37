import type { Metadata } from "next";
import { PatientFeedbackForm } from "@/components/features/patient/PatientFeedbackForm";
import { specialtyLabel } from "@/lib/admin/clinician-labels";
import { getFeedbackClinicians } from "@/lib/dal/feedback";

export const metadata: Metadata = {
  title: "Share feedback",
};

export default async function PatientFeedbackPage() {
  const clinicians = await getFeedbackClinicians();

  return (
    <div className="flex w-full flex-col">
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
        <div className="mt-8">
          <PatientFeedbackForm
            clinicians={clinicians.map((clinician) => ({
              id: clinician.id,
              name: [clinician.first_name, clinician.last_name].filter(Boolean).join(" "),
              specialty: clinician.specialty ? specialtyLabel(clinician.specialty) : "",
            }))}
          />
        </div>
      )}
    </div>
  );
}
