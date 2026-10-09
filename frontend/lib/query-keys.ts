/**
 * Query key factory.
 *
 * Only keys that a `useQuery` actually reads live here. The app's server-rendered
 * screens (the HCP profile sections, the auth session) are refreshed with
 * `router.refresh()` rather than cached, so they have no keys.
 *
 * The previous version also declared `hcpKeys.profile.*`, `hcpKeys.verification.*`
 * and `appointmentKeys`. Nothing ever queried them, so every `invalidateQueries`
 * against those keys was a no-op that read as if the cache were being kept
 * correct. Re-add a key here only when something reads it.
 */

export const userKeys = {
  all: ["user"] as const,
  current: () => [...userKeys.all, "current"] as const,
};

/**
 * Directory reads. `lists()` exists so the booking mutation can invalidate every
 * listing without knowing which filter combination produced it.
 */
export const hcpKeys = {
  all: ["hcps"] as const,
  lists: () => [...hcpKeys.all, "list"] as const,
  list: (filters: unknown, sort: string, page: number) =>
    [...hcpKeys.lists(), { filters, sort, page }] as const,
  filterOptions: () => [...hcpKeys.all, "filter-options"] as const,
  /** Keyed by provider and range, so one clinic's slots can never be shown for another. */
  availability: (hcpId: number, from: string, to: string) =>
    [...hcpKeys.all, "availability", { hcpId, from, to }] as const,
  /** Every availability read, for invalidating a clinic's slots after a booking. */
  availabilities: () => [...hcpKeys.all, "availability"] as const,
};

/**
 * Appointment keys.
 *
 * `lists()` exists so a booking, reschedule or cancellation can invalidate every
 * page at once: those writes change what `index` returns, and the patient may have
 * paged through several of them.
 */
export const appointmentKeys = {
  all: ["appointments"] as const,
  details: (id: number | string) => [...appointmentKeys.all, "detail", id] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (page: number) => [...appointmentKeys.lists(), { page }] as const,
};

/**
 * The clinician's appointments, kept under their own keys.
 *
 * The two roles read the same `AppointmentResource` but from different endpoints
 * (`/patient/appointments` vs `/hcp/appointments`), and a clinician's row is not a
 * patient's row - it carries the attendee's identity and not "(you)". Sharing the
 * keys would mean one role's cached list could be rendered for the other, so the
 * prefix is deliberately different even though the record type is the same.
 */
export const hcpAppointmentKeys = {
  all: ["hcp", "appointments"] as const,
  details: (id: number | string) => [...hcpAppointmentKeys.all, "detail", id] as const,
  lists: () => [...hcpAppointmentKeys.all, "list"] as const,
  list: (page: number) => [...hcpAppointmentKeys.lists(), { page }] as const,
};
