import { CalendarDays, MessageSquare, UserRound, UsersRound } from "lucide-react";
import type { PatientNavigationItem } from "@/types/hcp";

export const hcpNavigation: PatientNavigationItem[] = [
  {
    label: "Profile",
    href: "/hcp/profile",
    icon: UserRound,
    ariaLabel: "Navigate to HCP Profile",
  },
  {
    label: "Connected Patients",
    href: "/hcp/patients",
    icon: UsersRound,
    ariaLabel: "Navigate to Connected Patients",
  },
  {
    label: "Appointments",
    href: "/hcp/appointments",
    icon: CalendarDays,
    ariaLabel: "Navigate to Appointments",
  },
  {
    label: "Messages",
    href: "/hcp/messages",
    icon: MessageSquare,
    ariaLabel: "Navigate to Messages",
  },
];
