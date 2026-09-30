"use client";

import { useState } from "react";
import { AIAssistantLauncher } from "./AIAssistantLauncher";
import { AIAssistantPanel } from "./AIAssistantPanel";

export function PatientAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return <AIAssistantPanel onClose={() => setIsOpen(false)} />;
  }

  return <AIAssistantLauncher onClick={() => setIsOpen(true)} />;
}
