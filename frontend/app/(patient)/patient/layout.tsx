import type { ReactNode } from "react";
import { PatientAIAssistant } from "@/components/features/patient/AIAssistant/PatientAIAssistant";
import { AppShell } from "@/components/layout/AppShell";
import { availableNavItems, patientNavigation } from "@/lib/constants/navigation";
import { requireRole } from "@/lib/dal/auth";

/**
 * Authoritative guard for the whole patient area. See the HCP layout for why this
 * cannot be left to `proxy.ts` alone.
 */
export default async function PatientAreaLayout({ children }: { children: ReactNode }) {
  await requireRole("PATIENT");

  return (
    <AppShell
      items={availableNavItems(patientNavigation)}
      label="Patient navigation"
      floatingNav
      aside={<PatientAIAssistant />}
    >
      {children}
    </AppShell>
  );
}
