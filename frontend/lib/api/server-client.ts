import "server-only";

import { cookies, headers } from "next/headers";
import { API_ORIGIN } from "./base-url";
import { NetworkError, readJsonBody, toApiError } from "./response";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_COOKIE_URL = "/sanctum/csrf-cookie";

async function buildCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

/**
 * This app's own origin, e.g. `http://localhost:3000`.
 *
 * Required, not cosmetic. Laravel Sanctum's `EnsureFrontendRequestsAreStateful`
 * only promotes a request to the stateful (cookie) stack when it carries an
 * `Origin` or `Referer` matching `SANCTUM_STATEFUL_DOMAINS`. Without one, Sanctum
 * falls back to its token guard and answers `401 Unauthenticated` even though the
 * forwarded session cookie is perfectly valid. `proxy.ts` sends these headers,
 * which is why its gate worked while every Server Component read failed.
 */
async function appOrigin(): Promise<string> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");

  if (host) {
    const protocol =
      incoming.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type ServerRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Forward the caller's cookies to the API. Defaults to `true`. */
  forwardCookies?: boolean;
};

export async function serverRequest<T>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const { body, forwardCookies = true, headers: extraHeaders, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = body !== undefined;

  const buildHeaders = async (): Promise<Headers> => {
    const headers = new Headers(extraHeaders);
    headers.set("accept", "application/json");

    // Marks the request as same-app for Sanctum's stateful middleware. Without
    // these the API rejects the forwarded session cookie with a 401.
    const origin = await appOrigin();
    if (!headers.has("origin")) headers.set("origin", origin);
    if (!headers.has("referer")) headers.set("referer", `${origin}/`);

    if (forwardCookies) {
      const cookie = await buildCookieHeader();
      if (cookie.length > 0) headers.set("cookie", cookie);
    }
    if (hasBody && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  };

  const send = async (headers: Headers): Promise<Response> => {
    try {
      return await fetch(`${API_ORIGIN}${path}`, {
        ...rest,
        method: rest.method ?? "GET",
        cache: "no-store",
        headers,
        body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
      });
    } catch {
      throw new NetworkError();
    }
  };

  let headers = await buildHeaders();
  let response = await send(headers);

  if (response.status === 419) {
    const cookieHeader = await buildCookieHeader();
    const origin = await appOrigin();
    await fetch(`${API_ORIGIN}${CSRF_COOKIE_URL}`, {
      headers: {
        accept: "application/json",
        origin,
        referer: `${origin}/`,
        ...(cookieHeader.length > 0 ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    }).catch(() => undefined);

    headers = await buildHeaders();
    const store = await cookies();
    const xsrf = store.get(CSRF_COOKIE)?.value;
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);

    response = await send(headers);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await readJsonBody(response)) as T;
}

export type { ApiMessageResponse } from "./response";
export { ApiError, getApiErrorMessage, getApiFieldError, NetworkError } from "./response";
