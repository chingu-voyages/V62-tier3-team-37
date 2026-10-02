import type { ReactNode } from "react";
import { PatientAIAssistant } from "@/components/features/Patient/AIAssistant/PatientAIAssistant";
import { PatientAsideLayout, PatientMainLayout } from "@/layouts/Patient";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <PatientAsideLayout />
      <PatientMainLayout>
        <div className="flex w-full flex-1 flex-col">{children}</div>
      </PatientMainLayout>
      <PatientAIAssistant />
    </div>
  );
}
