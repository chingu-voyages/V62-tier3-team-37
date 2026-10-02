import type { ReactNode } from "react";
import { PatientAIAssistant } from "@/components/features/Patient/AIAssistant/PatientAIAssistant";
import { HcpAsideLayout } from "@/layouts/Hcp";
import { PatientMainLayout } from "@/layouts/Patient";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <HcpAsideLayout />
      <PatientMainLayout>
        <div className="flex flex-1 items-center justify-center">{children}</div>
      </PatientMainLayout>
      <PatientAIAssistant />
    </div>
  );
}
