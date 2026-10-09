import { Activity, Droplets, HeartPulse, type LucideIcon, Ruler, Scale } from "lucide-react";
import type { FC } from "react";

import { ProfileCard, SectionEmptyState } from "@/components/features/shared/profile";
import type {
  PatientEditableHealth,
  PatientHealthProfile as PatientHealth,
} from "@/types/patient-profile";
import { EditHealthForm } from "../shared";

type PatientHealthProps = {
  health: PatientHealth;
  /** Raw form values, so the editor is never seeded by parsing a rendered number. */
  editable: PatientEditableHealth;
};

type Highlight = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const formatHeight = (heightCm?: number): string =>
  heightCm === undefined ? "" : `${heightCm} cm`;

const formatWeight = (weightKg?: number): string =>
  weightKg === undefined ? "" : `${weightKg} kg`;

const formatBmi = (bmi?: number): string => (bmi === undefined ? "" : bmi.toFixed(1));

/**
 * The vitals a patient keeps on file: blood type, height, weight and the BMI
 * derived from the last two.
 *
 * Only the values that are actually set get a slot, so a half-filled profile reads
 * as "three facts" rather than as a four-column row with a blank cell in it - which
 * looks like a rendering fault rather than a missing measurement.
 */
export const PatientHealthProfile: FC<PatientHealthProps> = ({ health, editable }) => {
  const highlights: Highlight[] = [
    { label: "Blood type", value: health.bloodType ?? "", icon: Droplets },
    { label: "Height", value: formatHeight(health.heightCm), icon: Ruler },
    { label: "Weight", value: formatWeight(health.weightKg), icon: Scale },
    { label: "BMI", value: formatBmi(health.bmi), icon: Activity },
  ].filter((highlight) => highlight.value !== "");

  return (
    <ProfileCard
      title="Health Profile"
      icon={HeartPulse}
      action={<EditHealthForm values={editable} />}
    >
      {highlights.length === 0 ? (
        <SectionEmptyState message="No health details on file yet." />
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-accent p-4 @xl:grid-cols-4">
            {highlights.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-1.5 type-helper text-muted-foreground">
                  <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 type-body font-medium text-foreground tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          {health.bmi === undefined ? null : (
            // Stated rather than left to be worked out: BMI is the one number here
            // the patient did not type, and it moves whenever height or weight does.
            <p className="type-helper text-muted-foreground">
              BMI is worked out from the height and weight above.
            </p>
          )}
        </div>
      )}
    </ProfileCard>
  );
};
