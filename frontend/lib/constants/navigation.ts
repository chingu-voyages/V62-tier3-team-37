import { type NavItem, ROUTES } from "@/lib/constants/routes";

/**
 * Sidebar destinations, per area.
 *
 * Entries with `implemented: false` are intentionally retained so the intended
 * information architecture stays visible in one file, but they are filtered out
 * of the rendered nav until their route exists — three of the five patient
 * destinations previously 404'd.
 *
 * Icons are referenced by key, not by component. `AppShell` is a Server
 * Component, and Next refuses to pass a function across the server/client
 * boundary; storing a component here failed the build with "Functions cannot be
 * passed directly to Client Components". `AsideNav` resolves the key on the client.
 */
export const patientNavigation: NavItem[] = [
  {
    label: "Search for Doctors",
    href: ROUTES.patientSearch,
    icon: "search",
    ariaLabel: "Navigate to Search for Doctors",
    implemented: true,
  },
  {
    label: "Appointments",
    href: ROUTES.patientHome,
    icon: "calendar",
    ariaLabel: "Navigate to Appointments",
    implemented: true,
  },
  {
    label: "Health Records",
    href: ROUTES.patientRecords,
    icon: "clipboard",
    ariaLabel: "Navigate to Health Records",
    implemented: false,
  },
  {
    label: "Messages",
    href: ROUTES.patientMessages,
    icon: "message",
    ariaLabel: "Navigate to Messages",
    implemented: false,
  },
  {
    label: "AI Assistant",
    href: ROUTES.patientAssistant,
    icon: "sparkles",
    ariaLabel: "Navigate to AI Assistant",
    implemented: false,
  },
];

export const hcpNavigation: NavItem[] = [
  {
    label: "Profile",
    href: ROUTES.hcpProfile,
    icon: "user",
    ariaLabel: "Navigate to HCP Profile",
    implemented: true,
  },
  {
    label: "Connected Patients",
    href: ROUTES.hcpPatients,
    icon: "users",
    ariaLabel: "Navigate to Connected Patients",
    implemented: true,
  },
  {
    label: "Appointments",
    href: ROUTES.hcpAppointments,
    icon: "calendarDays",
    ariaLabel: "Navigate to Appointments",
    implemented: true,
  },
  {
    label: "Messages",
    href: ROUTES.hcpMessages,
    icon: "message",
    ariaLabel: "Navigate to Messages",
    implemented: true,
  },
];

/** Only destinations whose route actually exists. */
export function availableNavItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.implemented);
}
