import type { ReactNode } from "react";

import { PROFILE_BACK_LINKS, ProfilePageHeader } from "@/components/features/shared/profile";

type ProfileLayoutProps = {
  children: ReactNode;
  overview: ReactNode;
  health: ReactNode;
  allergies: ReactNode;
};

/**
 * The patient profile screen: a masthead plus three independently-loaded sections.
 *
 * Same grid contract as the HCP profile - explicit grid lines, `items-start`,
 * source order at every width - with the slots this profile actually has:
 *
 * - narrow: overview, health, allergies, one column
 * - `lg`:    overview and health span both columns, allergies sits beside them
 * - `xl`:    health takes the wide column and allergies the narrow one beside it
 *
 * Three sections rather than five because the patient endpoint exposes three
 * distinct concerns - identity, health, allergies - and padding the grid with
 * cards that repeat the same fields would only add scrolling.
 */
export default function PatientProfileLayout({
  children,
  overview,
  health,
  allergies,
}: ProfileLayoutProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      {children}

      <ProfilePageHeader
        title="Your Profile"
        description="Your details, health information and allergies, in one place."
        backHref={PROFILE_BACK_LINKS.patient.href}
        backLabel={PROFILE_BACK_LINKS.patient.label}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-1 xl:col-start-1 xl:col-end-3 xl:row-start-1">
          {overview}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-2 xl:col-start-1 xl:col-end-2 xl:row-start-2">
          {health}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:col-end-2 lg:row-start-3 xl:col-start-2 xl:col-end-3 xl:row-start-2">
          {allergies}
        </div>
      </div>
    </div>
  );
}
