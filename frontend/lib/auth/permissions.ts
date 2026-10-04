import { NAV_BASE_PATHS, ROUTES } from "@/lib/constants/routes";
import type { AuthUser, SignupRole } from "@/types/auth";

/**
 * Role and area policy.
 *
 * This module is deliberately pure and dependency-free so that it can be shared
 * by `proxy.ts` (Edge runtime) and by Server Components / layouts. Post-login
 * routing used to be implemented in both `proxy.ts` and the login form, and the
 * two copies disagreed; there is now exactly one implementation.
 */

export const HCP_ROLE: SignupRole = "HCP";
export const PATIENT_ROLE: SignupRole = "PATIENT";

function isHcpRole(role: string | null | undefined): boolean {
  return role === HCP_ROLE;
}

function isPatientRole(role: string | null | undefined): boolean {
  return role === PATIENT_ROLE;
}

/** Whether the account has completed email verification. */
export function isEmailVerified(user: AuthUser): boolean {
  return Boolean(user?.email_verified_at);
}

/**
 * Where a user lands immediately after authenticating.
 *
 * Patients open their home, which holds visits and the clinician search.
 * Unverified accounts are sent to the OTP screen by the route guard before
 * this destination renders.
 */
export function homePathForRole(role: string | null | undefined): string {
  return isHcpRole(role) ? ROUTES.hcpProfile : ROUTES.patientHome;
}

function isPatientArea(pathname: string): boolean {
  return pathname.startsWith(`${NAV_BASE_PATHS.patient}/`);
}

function isHcpArea(pathname: string): boolean {
  return pathname.startsWith(`${NAV_BASE_PATHS.hcp}/`);
}

/** Routes only an unauthenticated visitor may reach. */
function isGuestOnlyPath(pathname: string): boolean {
  return pathname === ROUTES.auth;
}

/**
 * Reachable without a session.
 *
 * `/auth/otp` qualifies because the OTP endpoints are authenticated but the
 * account is not verified yet, which is exactly the state the user is in when they
 * land there.
 */
function isPubliclyReachableWhileGuest(pathname: string): boolean {
  return isGuestOnlyPath(pathname) || pathname === ROUTES.otp;
}

export type RouteDecision = { action: "allow" } | { action: "redirect"; to: string };

export function decideRouteAccess(pathname: string, user: AuthUser): RouteDecision {
  const guestOnly = isGuestOnlyPath(pathname);

  if (guestOnly) {
    return user ? { action: "redirect", to: homePathForRole(user?.role) } : { action: "allow" };
  }

  if (!user) {
    return isPubliclyReachableWhileGuest(pathname)
      ? { action: "allow" }
      : { action: "redirect", to: ROUTES.auth };
  }

  const onPatientRoute = isPatientArea(pathname);
  const onHcpRoute = isHcpArea(pathname);
  const onVerification = pathname === ROUTES.hcpVerification;

  if (onHcpRoute && !isHcpRole(user.role)) {
    return { action: "redirect", to: homePathForRole(user.role) };
  }

  if (onPatientRoute && !isPatientRole(user.role)) {
    return { action: "redirect", to: ROUTES.hcpProfile };
  }

  const needsVerifiedEmail = onPatientRoute || onHcpRoute || onVerification;
  if (needsVerifiedEmail && !isEmailVerified(user)) {
    return { action: "redirect", to: ROUTES.otp };
  }

  if (onVerification && !isHcpRole(user.role)) {
    return { action: "redirect", to: homePathForRole(user.role) };
  }

  return { action: "allow" };
}
