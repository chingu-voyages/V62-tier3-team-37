import type { Metadata } from "next";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { PatientBlockButton } from "@/components/features/admin/QueueActions";
import { userDisplayName } from "@/lib/auth/display";
import { getAdminPatients } from "@/lib/dal/admin";
import { requireAdmin } from "@/lib/dal/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Patients",
  robots: { index: false, follow: false },
};

export default async function AdminPatientsPage() {
  const user = await requireAdmin();
  const patients = await getAdminPatients();

  return (
    <AdminShell name={userDisplayName(user)} section="patients">
      <p className="type-step text-primary">Admin</p>
      <h1 className="mt-2 type-h1 text-foreground">Patients</h1>
      <p className="mt-2 max-w-xl type-body text-muted-foreground">
        Block an account when it should not be able to sign in. Medical files stay with the patient.
      </p>

      {patients.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center shadow-card ring-1 ring-border/70">
          <p className="type-body text-muted-foreground">No patients have signed up yet.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {patients.map((patient) => {
            const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ");
            const blocked = patient.status === "DISABLED";
            return (
              <li
                key={patient.id}
                className="flex flex-col gap-3 rounded-2xl bg-background px-5 py-4 shadow-card ring-1 ring-border/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="type-h4 text-foreground">{name || patient.email}</p>
                  <p className="mt-1 type-helper text-muted-foreground">{patient.email}</p>
                  <p className="mt-1 type-helper text-muted-foreground">
                    {blocked ? "Blocked" : "Active"}
                    {patient.created_at ? ` · Joined ${formatDateTime(patient.created_at)}` : ""}
                  </p>
                </div>
                <PatientBlockButton id={patient.id} blocked={blocked} />
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
