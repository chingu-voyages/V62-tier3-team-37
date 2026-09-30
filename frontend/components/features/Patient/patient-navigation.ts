import { Calendar, ClipboardList, MessageSquare, Search, Sparkles } from "lucide-react";
import type { PatientNavigationItem } from "@/types/hcp";

export const patientNavigation: PatientNavigationItem[] = [
  {
    label: "Search for Doctors",
    href: "/patient/search",
    icon: Search,
    ariaLabel: "Navigate to Search for Doctors",
  },
  {
    label: "Appointments",
    href: "/patient/appointments",
    icon: Calendar,
    ariaLabel: "Navigate to Appointments",
  },
  {
    label: "Health Records",
    href: "/patient/records",
    icon: ClipboardList,
    ariaLabel: "Navigate to Health Records",
  },
  {
    label: "Messages",
    href: "/patient/messages",
    icon: MessageSquare,
    ariaLabel: "Navigate to Messages",
  },
  {
    label: "AI Assistant",
    href: "/patient/assistant",
    icon: Sparkles,
    ariaLabel: "Navigate to AI Assistant",
  },
];
