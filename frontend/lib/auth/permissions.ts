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
export const ADMIN_ROLE = "ADMIN";

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
 * Patients return to the landing page, which is their home. Clinicians open
 * today's schedule. An account that is not accepted yet is sent on from that
 * page to the profile. Unverified email accounts are sent to the OTP screen by
 * the route guard before this destination renders.
 */
export function homePathForRole(role: string | null | undefined): string {
  if (role === ADMIN_ROLE) return ROUTES.adminHome;
  return isHcpRole(role) ? ROUTES.hcpToday : ROUTES.home;
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
 * The landing page stays public. `/auth/otp` qualifies because the OTP endpoints
 * are authenticated but the account is not verified yet, which is exactly the
 * state the user is in when they land there.
 */
function isPubliclyReachableWhileGuest(pathname: string): boolean {
  return isGuestOnlyPath(pathname) || pathname === ROUTES.otp || pathname === ROUTES.home;
}

export type RouteDecision = { action: "allow" } | { action: "redirect"; to: string };

export function decideRouteAccess(pathname: string, user: AuthUser): RouteDecision {
  const guestOnly = isGuestOnlyPath(pathname);

  if (guestOnly) {
    if (!user) return { action: "allow" };
    return {
      action: "redirect",
      to: isEmailVerified(user) ? homePathForRole(user.role) : ROUTES.otp,
    };
  }

  if (!user) {
    if (pathname === ROUTES.admin) return { action: "allow" };
    if (pathname === ROUTES.adminHome || pathname.startsWith(`${ROUTES.admin}/`)) {
      return { action: "redirect", to: ROUTES.admin };
    }
    return isPubliclyReachableWhileGuest(pathname)
      ? { action: "allow" }
      : { action: "redirect", to: ROUTES.auth };
  }

  if (!isEmailVerified(user) && pathname !== ROUTES.otp) {
    return { action: "redirect", to: ROUTES.otp };
  }

  const onPatientRoute = isPatientArea(pathname);
  const onHcpRoute = isHcpArea(pathname);
  const onVerification = pathname === ROUTES.hcpVerification;

  if (onHcpRoute && !isHcpRole(user.role)) {
    return { action: "redirect", to: homePathForRole(user.role) };
  }

  if (pathname === ROUTES.admin) {
    return user?.role === ADMIN_ROLE
      ? { action: "redirect", to: ROUTES.adminHome }
      : { action: "allow" };
  }

  if (pathname === ROUTES.adminHome || pathname.startsWith(`${ROUTES.admin}/`)) {
    return user?.role === ADMIN_ROLE
      ? { action: "allow" }
      : { action: "redirect", to: ROUTES.admin };
  }

  if (onPatientRoute && !isPatientRole(user.role)) {
    return { action: "redirect", to: homePathForRole(user.role) };
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
