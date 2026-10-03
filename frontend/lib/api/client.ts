/**
 * Browser transport for the Laravel API.
 *
 * Server Components and Server Actions must NOT use this module — they have no
 * access to `document.cookie`. Use `@/lib/api/server-client` there instead.
 */

import { NetworkError, readJsonBody, toApiError } from "./response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_COOKIE_URL = "/sanctum/csrf-cookie";

let csrfRequest: Promise<void> | null = null;

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!raw) return undefined;
  const value = raw.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function fetchCsrfCookie(): Promise<void> {
  if (csrfRequest) {
    await csrfRequest;
    return;
  }

  csrfRequest = fetch(`${API_BASE_URL}${CSRF_COOKIE_URL}`, {
    credentials: "include",
    headers: { accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new NetworkError(
          "Could not establish a secure session. Please reload and try again.",
        );
      }
    })
    .finally(() => {
      csrfRequest = null;
    });

  await csrfRequest;
}

async function ensureCsrfToken(): Promise<string | undefined> {
  const existing = getCookie(CSRF_COOKIE);
  if (existing) return existing;

  await fetchCsrfCookie();
  return getCookie(CSRF_COOKIE);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/** Methods that cannot change server state, so they need no CSRF token. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = body !== undefined;
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !SAFE_METHODS.has(method);

  const send = async (token: string | undefined): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (!headers.has("accept")) {
      headers.set("accept", "application/json");
    }
    // For multipart/form-data we must NOT set a Content-Type: the browser
    // generates the multipart boundary automatically.
    if (hasBody && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("X-XSRF-TOKEN", token);
    } else {
      headers.delete("X-XSRF-TOKEN");
    }

    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        method,
        credentials: "include",
        headers,
        body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw new NetworkError();
    }
  };

  // A read cannot be rejected for a stale token, so do not pay for the CSRF
  // handshake on the way to one - it is a whole extra round trip before the
  // request the caller actually asked for.
  let response = await send(needsCsrf ? await ensureCsrfToken() : undefined);

  if (response.status === 419 && needsCsrf) {
    await fetchCsrfCookie();
    response = await send(getCookie(CSRF_COOKIE));
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
