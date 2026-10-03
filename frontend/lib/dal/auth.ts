import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { serverRequest } from "@/lib/api/server-client";
import { homePathForRole, isEmailVerified } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import type { AuthUser, SignupRole } from "@/types/auth";

async function fetchOptionalUser(): Promise<AuthUser> {
  try {
    return await serverRequest<AuthUser>("/api/user");
  } catch {
    return null;
  }
}

/**
 * The current user, or `null`.
 *
 * Memoised per request with React `cache`, so a layout, a page and five profile
 * slots that all read it issue one upstream call rather than one per reader.
 *
 * Read this in Server Components and layouts rather than relying on `proxy.ts`
 * alone. `proxy.ts` is a coarse redirect gate that caches `/api/user` for a few
 * seconds, so it is not authoritative: it can admit a request whose session has
 * since been revoked, and it never sees a Server Component's data needs. These
 * guards are the check that actually gates a render.
 */
export const getOptionalUser = cache(fetchOptionalUser);

/** Redirect to sign-in when there is no session. */
export async function requireUser(): Promise<NonNullable<AuthUser>> {
  const user = await getOptionalUser();
  if (!user) {
    redirect(ROUTES.auth);
  }
  return user;
}

/** Redirect an already-authenticated visitor away from guest-only screens. */
export async function requireGuest(): Promise<void> {
  const user = await getOptionalUser();
  if (user) {
    redirect(homePathForRole(user.role));
  }
}

/**
 * Redirect unless the session belongs to `role` and has a verified email.
 *
 * Verification is checked here rather than left to the API because every
 * authenticated endpoint in this app answers `409 Conflict` for an unverified
 * account; redirecting to the OTP screen is the documented next step, whereas the
 * 409 surfaces as a failed section with no route forward.
 */
export async function requireRole(
  role: SignupRole,
  options: { verified?: boolean } = {},
): Promise<NonNullable<AuthUser>> {
  const { verified = true } = options;
  const user = await requireUser();

  if (user.role !== role) {
    redirect(homePathForRole(user.role));
  }

  if (verified && !isEmailVerified(user)) {
    redirect(ROUTES.otp);
  }

  return user;
}
