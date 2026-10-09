import { ShieldAlert } from "lucide-react";

import { ProfileCard, SectionEmptyState } from "@/components/features/shared/profile";
import type { PatientAllergy } from "@/types/patient-profile";
import { AllergySeverityBadge, EditAllergiesForm } from "../shared";

type PatientAllergiesProps = {
  allergies: PatientAllergy[];
};

/**
 * What the patient reacts to, one row per allergy.
 *
 * The severity sits beside the name because it is the part a reader scans for,
 * while the reaction - which may be a whole sentence - is the part that explains
 * it. An empty list is stated plainly rather than collapsing into nothing.
 */
export function PatientAllergies({ allergies }: PatientAllergiesProps) {
  return (
    <ProfileCard
      title="Allergies"
      icon={ShieldAlert}
      action={<EditAllergiesForm values={allergies} />}
    >
      {allergies.length === 0 ? (
        <SectionEmptyState message="No allergies recorded yet." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {allergies.map((allergy, position) => {
            // The API gives an allergy no id, so the name is its identity; the
            // position only breaks a tie between two rows that happen to share one,
            // which would otherwise be a duplicate key.
            const rowKey = `${allergy.name}-${position}`;

            return (
              <li
                key={rowKey}
                className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="type-label font-medium text-foreground">{allergy.name}</p>
                  {allergy.reaction ? (
                    <p className="mt-0.5 type-helper wrap-break-word text-muted-foreground">
                      {allergy.reaction}
                    </p>
                  ) : null}
                </div>

                <AllergySeverityBadge severity={allergy.severity} />
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCard>
  );
}
