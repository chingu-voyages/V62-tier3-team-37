/**
 * Query key factory.
 *
 * Only keys that a `useQuery` actually reads live here. The app has exactly one
 * cached read - the current user - and everything else is a Server Component
 * reading through `lib/dal`, refreshed with `router.refresh()`.
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
