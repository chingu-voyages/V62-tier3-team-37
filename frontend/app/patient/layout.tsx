import type { ReactNode } from "react";
import { PatientAIAssistant } from "@/components/features/Patient/AIAssistant/PatientAIAssistant";
import { MainLayout, PatientAsideLayout } from "@/layouts/Patient";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <PatientAsideLayout />
      <MainLayout>
        <div className="flex flex-1 items-center justify-center">{children}</div>
      </MainLayout>
      <PatientAIAssistant />
    </div>
  );
}
