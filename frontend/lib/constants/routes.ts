/**
 * Navigation destinations reference icons by key rather than by component.
 *
 * `AppShell` renders on the server and hands this data to the client `AsideNav`;
 * Next rejects a function crossing that boundary, so a `LucideIcon` in the data
 * would fail the build. `AsideNav` resolves the key on the client.
 */
export type NavIconKey =
  | "search"
  | "calendar"
  | "calendarDays"
  | "clipboard"
  | "message"
  | "sparkles"
  | "user"
  | "users";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconKey;
  ariaLabel: string;
  /** Set to false until the route exists; hidden from the sidebar until then. */
  implemented: boolean;
};

export const ROUTES = {
  home: "/",
  auth: "/auth",
  otp: "/auth/otp",
  hcpVerification: "/auth/hcp/verification",

  patientAppointments: "/patient/appointments",
  patientProfile: "/patient/profile",
  patientSearch: "/patient/search",
  patientRecords: "/patient/records",
  patientMessages: "/patient/messages",
  patientAssistant: "/patient/assistant",
  patientSettings: "/patient/settings",

  hcpProfile: "/hcp/profile",
  hcpPatients: "/hcp/patients",
  hcpAppointments: "/hcp/appointments",
  hcpMessages: "/hcp/messages",
  hcpSettings: "/hcp/settings",

  /** Legal. Referenced by the footer and the signup form; pages still to be authored. */
  terms: "/terms",
  privacy: "/privacy",
  support: "/support",
} as const;

export const NAV_BASE_PATHS = {
  patient: "/patient",
  hcp: "/hcp",
} as const;
