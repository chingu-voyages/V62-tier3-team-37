import { HCP_ROLE } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import type { AuthUser } from "@/types/auth";

/**
 * Presentation helpers for the signed-in user.
 *
 * Kept out of the components so the navbar, the sidebar and any future account
 * surface all resolve a missing name the same way, instead of each inventing its
 * own fallback.
 */

/** Anything carrying the two name fields — a full user record or just the names. */
type NamedLike = { first_name?: string | null; last_name?: string | null } | null | undefined;

export function userFirstName(user: NamedLike): string {
  return user?.first_name?.trim() || "";
}

export function userLastName(user: NamedLike): string {
  return user?.last_name?.trim() || "";
}

/** "Ada Lovelace". Falls back to the email local part, then to "Account". */
export function userDisplayName(user: AuthUser): string {
  const full = [userFirstName(user), userLastName(user)].filter(Boolean).join(" ");
  if (full) return full;

  const email = user?.email?.trim();
  if (email) return email.split("@")[0] ?? "Account";

  return "Account";
}

/** "AL", or a single letter when only one name is known. */
export function userInitials(user: NamedLike): string {
  const first = userFirstName(user).charAt(0);
  const last = userLastName(user).charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "H";
}

/** Where the "Profile" item in the account menu should point. */
export function userProfileHref(user: AuthUser): string {
  return user?.role === HCP_ROLE ? ROUTES.hcpProfile : ROUTES.patientProfile;
}
