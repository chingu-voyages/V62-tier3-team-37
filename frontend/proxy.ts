import { type NextRequest, NextResponse } from "next/server";
import { decideRouteAccess } from "@/lib/auth/permissions";
import type { AuthUser } from "@/types/auth";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const USER_CACHE_TTL_MS = 5_000;
const USER_CACHE_MAX_ENTRIES = 500;

type CachedUser = {
  user: AuthUser;
  expiresAt: number;
};

/**
 * Short-lived per-cookie cache so a burst of client-side navigations does not
 * re-hit `/api/user` for every request. Bounded in both size and lifetime:
 * entries are pruned on every access and the oldest is evicted once the cap is
 * reached, so a cookie-spray burst cannot pin memory indefinitely.
 *
 * This is a latency optimisation only. It is not the authorisation check - it
 * cannot be, because a cached decision outlives the session it was made from. The
 * authoritative check lives in `lib/dal/auth` (`requireRole` and friends), which
 * every protected layout runs.
 */
const userCache = new Map<string, CachedUser>();

async function fetchUser(cookie: string, origin: string): Promise<AuthUser> {
  if (!API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/api/user`, {
      headers: { cookie, accept: "application/json", referer: origin, origin },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as AuthUser) : null;
  } catch {
    return null;
  }
}

async function getUser(req: NextRequest) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  const now = Date.now();

  const cached = userCache.get(cookie);
  if (cached && cached.expiresAt > now) {
    // Re-insert to mark this entry as most recently used.
    userCache.delete(cookie);
    userCache.set(cookie, cached);
    return cached.user;
  }

  const user = await fetchUser(cookie, req.nextUrl.origin);

  for (const [key, value] of userCache) {
    if (value.expiresAt <= now) userCache.delete(key);
  }

  if (userCache.size >= USER_CACHE_MAX_ENTRIES) {
    const oldest = userCache.keys().next();
    if (!oldest.done) userCache.delete(oldest.value);
  }

  // Only successful lookups are cached. Caching a `null` - which is what an
  // expired session or an unreachable API both produce - meant that signing in
  // right after a request was still treated as a guest for the rest of the TTL, so
  // the login form appeared to do nothing until the cache expired.
  if (user) {
    userCache.set(cookie, { user, expiresAt: now + USER_CACHE_TTL_MS });
  } else {
    userCache.delete(cookie);
  }

  return user;
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const user = await getUser(req);

  const decision = decideRouteAccess(pathname, user);
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/patient/:path*", "/hcp/:path*"],
};
