/**
 * The API origin, resolved once.
 *
 * Server Components may use `API_URL` (server-only, never exposed to the
 * browser); client code only ever sees `NEXT_PUBLIC_API_URL`. Both resolve to
 * the same fallback, and a reference to the server-only name from the browser
 * bundle evaluates to `undefined`, so this single constant is correct on both
 * sides without two parallel declarations drifting apart.
 */
export const API_ORIGIN =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
