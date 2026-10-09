import { API_ORIGIN } from "./base-url";

/**
 * Absolute URL for a file on Laravel's `public` disk.
 *
 * The profile endpoints answer with a stored *path* (`profile-photos/3/ab.jpg`),
 * not a URL - `HcpProfileResource` resolves it with `Storage::disk('public')->url()`,
 * `PatientProfileResource` returns the raw column. The browser cannot load a
 * backend-relative path from this app's origin, so the path is resolved against
 * the API origin here, which is the same base URL `Storage` builds from
 * (`${APP_URL}/storage`).
 *
 * A convenience for any API response that hands back a storage path; the profile
 * photo is the first such field the UI actually renders.
 */
export function publicStorageUrl(path: string | null | undefined): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;

  return `${API_ORIGIN.replace(/\/+$/, "")}/storage/${trimmed.replace(/^\/+/, "")}`;
}
