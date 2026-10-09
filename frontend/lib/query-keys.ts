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
 * `details(id)` exists so a created appointment has a stable home if it is ever
 * read directly; nothing reads it yet, so it is deliberately *not* populated on
 * success - invalidating a key no query watches would only look like caching.
 */
export const appointmentKeys = {
  all: ["appointments"] as const,
  details: (id: number | string) => [...appointmentKeys.all, "detail", id] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: unknown) => [...appointmentKeys.lists(), { filters }] as const,
};
