import { CalendarDays } from "lucide-react";
import type { HcpAvailability, WorkingDayKey } from "@/types/hcp-profile";
import { ProfileCard, SectionEmptyState, StaticEditButton } from "../shared";

type ProfileAvailabilitySectionProps = {
  availability?: HcpAvailability;
};

const DAY_PILL_LABELS: { key: WorkingDayKey; label: string }[] = [
  { key: "MON", label: "Mon" },
  { key: "TUE", label: "Tue" },
  { key: "WED", label: "Wed" },
  { key: "THU", label: "Thu" },
  { key: "FRI", label: "Fri" },
  { key: "SAT", label: "Sat" },
  { key: "SUN", label: "Sun" },
];

const DAY_LABELS_BY_KEY = new Map(DAY_PILL_LABELS.map((day) => [day.key, day.label]));

export function ProfileAvailabilitySection({ availability }: ProfileAvailabilitySectionProps) {
  const workingDays = new Set(availability?.workingDays ?? []);
  const ranges = availability?.ranges ?? [];
  const hasSchedule = workingDays.size > 0 || ranges.length > 0;

  return (
    <ProfileCard
      title="Availability"
      icon={CalendarDays}
      action={<StaticEditButton label="Edit availability" />}
      className="h-full"
    >
      <p className="type-helper text-muted-foreground">Set your working days and hours</p>

      {hasSchedule ? (
        <>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {DAY_PILL_LABELS.map((day) => {
              const isAvailable = workingDays.has(day.key);

              return (
                <li key={day.key}>
                  <span
                    className={
                      isAvailable
                        ? "inline-flex items-center rounded-lg border border-secondary/30 bg-accent px-2.5 py-1 type-helper font-medium text-primary"
                        : "inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 type-helper text-muted-foreground"
                    }
                  >
                    {day.label}
                    <span className="sr-only">
                      {isAvailable ? " — available" : " — not available"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          {ranges.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/60 px-3.5 py-1">
              <ul className="flex flex-col divide-y divide-border/70">
                {ranges.map((range) => (
                  <li
                    key={`${range.startTime}-${range.endTime}-${range.days.join("-")}`}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5"
                  >
                    <span className="type-label font-medium text-foreground">
                      {range.startTime} – {range.endTime}
                    </span>
                    <span className="flex min-w-0 flex-wrap justify-end gap-1.5">
                      {range.days.map((day) => (
                        <span
                          key={day}
                          className="rounded-md bg-card px-1.5 py-0.5 type-helper text-muted-foreground"
                        >
                          {DAY_LABELS_BY_KEY.get(day) ?? day}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <SectionEmptyState message="Your availability hasn't been set up yet." className="mt-4" />
      )}
    </ProfileCard>
  );
}
