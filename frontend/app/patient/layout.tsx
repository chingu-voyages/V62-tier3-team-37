import type { ReactNode } from "react";
import { PatientAIAssistant } from "@/components/features/Patient/AIAssistant/PatientAIAssistant";
import { PatientAsideLayout, PatientMainLayout } from "@/layouts/Patient";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <PatientAsideLayout />
      <PatientMainLayout>
        <div className="flex flex-1 items-center justify-center">{children}</div>
      </PatientMainLayout>
      <PatientAIAssistant />
    </div>
  );
}
