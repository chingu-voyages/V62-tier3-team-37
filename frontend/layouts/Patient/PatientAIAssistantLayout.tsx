"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AIAssistantLauncher } from "@/components/features/Patient/AIAssistant/AIAssistantLauncher";
import { AIAssistantPanel } from "@/components/features/Patient/AIAssistant/AIAssistantPanel";

type PatientAIAssistantLayoutProps = {
  children: ReactNode;
};

export function PatientAIAssistantLayout({ children }: PatientAIAssistantLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children}
      {isOpen ? (
        <AIAssistantPanel onClose={() => setIsOpen(false)} />
      ) : (
        <AIAssistantLauncher onClick={() => setIsOpen(true)} />
      )}
    </>
  );
}
