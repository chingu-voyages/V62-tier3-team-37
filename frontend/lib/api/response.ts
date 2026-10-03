/**
 * Response parsing and error taxonomy shared by the browser and server transports.
 *
 * Keeping this in one place is what guarantees a Laravel 422 body is turned into
 * the same `ApiError` shape regardless of which side of the boundary it arrives on.
 */

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly errors: Record<string, string[]> | undefined;

  constructor(message: string, status?: number, errors?: Record<string, string[]> | undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Thrown when the request never produced a response (offline, DNS, TLS, abort). */
export class NetworkError extends Error {
  constructor(message = "Unable to reach the server. Please check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

export type ApiMessageResponse = {
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parse a response body as JSON, returning `undefined` for empty or non-JSON
 * payloads instead of throwing. A reverse proxy or misconfigured base URL can
 * answer with HTML, and that must never be reported as a network fault.
 */
export async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let errors: Record<string, string[]> | undefined;

  const data = await readJsonBody(response);
  if (isRecord(data)) {
    if (typeof data.message === "string" && data.message.length > 0) {
      message = data.message;
    }
    if (isRecord(data.errors)) {
      const collected: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(data.errors)) {
        if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
          collected[key] = value as string[];
        }
      }
      if (Object.keys(collected).length > 0) errors = collected;
    }
  }

  return new ApiError(message, response.status, errors);
}

export function getApiFieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError) || !error.errors) return undefined;
  return error.errors[field]?.[0];
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
