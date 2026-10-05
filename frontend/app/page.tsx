import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LandingContinue } from "@/components/features/landing/LandingContinue";
import { LandingHeader } from "@/components/features/landing/LandingHeader";
import { LandingSearch } from "@/components/features/landing/LandingSearch";
import type { BookingPatient } from "@/components/features/landing/PatientBookingPanel";
import { PatientAIAssistant } from "@/components/features/patient/AIAssistant/PatientAIAssistant";
import { AppAsideLayout } from "@/components/layout/AppAsideLayout";
import { Navbar } from "@/components/layout/Navbar";
import { userFirstName } from "@/lib/auth/display";
import { HCP_ROLE, PATIENT_ROLE } from "@/lib/auth/permissions";
import { availableNavItems, patientNavigation } from "@/lib/constants/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getOptionalUser } from "@/lib/dal/auth";
import { getPatientProfile } from "@/lib/dal/patient";
import type { AuthUser } from "@/types/auth";

/**
 * The public landing page, and the patient home.
 *
 * Guests see the marketing header. A signed-in patient sees the same page with
 * the floating tabs and their account menu. Signing out drops both, and the
 * page is the guest landing again. Clinicians are sent to their own area.
 */
export default async function HomePage() {
  const user = await getOptionalUser();

  if (user?.role === HCP_ROLE) {
    redirect(ROUTES.hcpProfile);
  }

  if (user && user.role === PATIENT_ROLE) {
    const patient = await bookingPatient(user);
    return (
      <div className="flex min-h-dvh bg-muted">
        <AppAsideLayout
          items={availableNavItems(patientNavigation)}
          label="Patient navigation"
          floating
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar user={user} variant="app" className="sticky top-0 z-30 shrink-0" />
          <main className="flex w-full flex-1 flex-col bg-muted pb-24 md:pb-0 md:pl-24">
            <LandingBody signedIn patientName={patient.firstName} patient={patient} />
          </main>
        </div>
        <PatientAIAssistant />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <LandingHeader user={user} />
      <main className="flex w-full flex-1 flex-col">
        <LandingBody />
      </main>
    </div>
  );
}

function LandingBody({
  signedIn = false,
  patientName,
  patient,
}: {
  signedIn?: boolean;
  patientName?: string;
  patient?: BookingPatient;
}): ReactNode {
  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <LandingSearch signedIn={signedIn} patientName={patientName} patient={patient} />
      </div>
      <LandingContinue signedIn={signedIn} />
    </>
  );
}

async function bookingPatient(user: NonNullable<AuthUser>): Promise<BookingPatient> {
  const fallback: BookingPatient = {
    firstName: userFirstName(user),
    lastName: user.last_name?.trim() || "",
    email: user.email?.trim() || "",
    birthDate: null,
    gender: null,
  };

  try {
    const profile = await getPatientProfile();
    return {
      firstName: profile.first_name?.trim() || fallback.firstName,
      lastName: profile.last_name?.trim() || fallback.lastName,
      email: profile.email?.trim() || fallback.email,
      birthDate: profile.birth_date,
      gender: profile.gender,
    };
  } catch {
    return fallback;
  }
}
