export class ApiError extends Error {
  readonly status: number | undefined;
  readonly errors: Record<string, string[]> | undefined;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type ApiMessageResponse = {
  message?: string;
};

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

  csrfRequest = fetch(`${API_BASE_URL}${CSRF_COOKIE_URL}`, { credentials: "include" })
    .then(() => undefined)
    .catch(() => {})
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toJsonError(raw?: Record<string, string[]>): Record<string, string[]> | undefined {
  if (!raw) return undefined;
  const errors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      errors[key] = value as string[];
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

async function readApiError(response: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let errors: Record<string, string[]> | undefined;
  try {
    const data: unknown = await response.json();
    if (isRecord(data) && typeof data.message === "string" && data.message.length > 0) {
      message = data.message;
    }
    if (isRecord(data) && isRecord(data.errors)) {
      errors = toJsonError(data.errors as Record<string, string[]>);
    }
  } catch {}
  return new ApiError(message, response.status, errors);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;

  const send = async (token: string | undefined): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (hasBody) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("X-XSRF-TOKEN", token);
    } else {
      headers.delete("X-XSRF-TOKEN");
    }
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });
  };

  const token = await ensureCsrfToken();
  let response = await send(token);

  if (response.status === 419) {
    await fetchCsrfCookie();
    response = await send(getCookie(CSRF_COOKIE));
  }

  if (!response.ok) {
    throw await readApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text.length > 0 ? (JSON.parse(text) as T) : (undefined as T);
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  return fallback;
}
