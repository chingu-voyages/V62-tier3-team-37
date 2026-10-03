/**
 * Hard-navigation fallback for this slot.
 *
 * Re-exports `page.tsx` so the recovery path renders the same section from the
 * same data access. Returning `null` here - as this file used to - would leave a
 * blank cell in the grid whenever Next could not restore the slot's soft
 * navigation state, which looks like a bug rather than a fallback.
 */
export { default } from "./page";
