import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL!;
const USER_CACHE_TTL_MS = 5000;

type CachedUser = {
  user: { role?: string; email_verified_at?: string | null } | null;
  expiresAt: number;
};

const userCache = new Map<string, CachedUser>();

async function getUser(req: NextRequest) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  const now = Date.now();
  const cached = userCache.get(cookie);

  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  try {
    const res = await fetch(`${API_URL}/api/user`, {
      headers: {
        cookie,
        accept: "application/json",
        referer: req.nextUrl.origin,
        origin: req.nextUrl.origin,
      },
      cache: "no-store",
    });

    const user = res.ok ? await res.json() : null;

    if (userCache.size > 100) {
      for (const [key, value] of userCache) {
        if (value.expiresAt <= now) userCache.delete(key);
      }
    }

    userCache.set(cookie, { user, expiresAt: now + USER_CACHE_TTL_MS });

    return user;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getUser(req);

  const lowerPath = pathname.toLowerCase();
  const isGuestOnly = pathname === "/auth";
  const isOtpPage = lowerPath === "/auth/otp";

  if (isGuestOnly && user) {
    const home = user.role === "HCP" ? "/hcp/profile" : "/patient/search";
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (!isGuestOnly && !user && !isOtpPage) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (user) {
    const onPatientRoute = lowerPath.startsWith("/patient/");
    const onHcpRoute = lowerPath.startsWith("/hcp/");
    const onHcpVerification = lowerPath === "/auth/hcp/verification";
    const isHcpUser = user.role === "HCP";
    const isPatientUser = user.role === "PATIENT";
    const emailVerified = !!user.email_verified_at;

    if (onHcpRoute && !isHcpUser) {
      return NextResponse.redirect(new URL("/patient/search", req.url));
    }

    if (onPatientRoute && !isPatientUser) {
      return NextResponse.redirect(new URL("/hcp/profile", req.url));
    }

    if (!emailVerified && (onPatientRoute || onHcpRoute)) {
      return NextResponse.redirect(new URL("/auth/otp", req.url));
    }

    if (onHcpVerification) {
      if (!isHcpUser) {
        return NextResponse.redirect(new URL("/patient/search", req.url));
      }
      if (!emailVerified) {
        return NextResponse.redirect(new URL("/auth/otp", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/patient/:path*", "/hcp/:path*"],
};
