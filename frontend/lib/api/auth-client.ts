import { type ApiMessageResponse, apiRequest } from "@/lib/api/client";
import type { LoginPayload, RegisterPayload, SignupRole } from "@/types/auth";

/**
 * Auth endpoints, called from the browser.
 *
 * These stay client-side on purpose: Laravel Sanctum issues the session cookie
 * on the response to `/login`. A Server Action would have to copy every
 * `Set-Cookie` header onto the Next response by hand, and the onboarding upload
 * (4 files, up to 40 MB) exceeds the Server Actions body limit anyway. Reads of
 * the session in server code belong in `@/lib/dal/auth` instead.
 */

const REGISTER_ENDPOINTS: Record<SignupRole, string> = {
  HCP: "/register/hcp",
  PATIENT: "/register/patient",
};

export function registerUser(
  role: SignupRole,
  payload: RegisterPayload,
): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(REGISTER_ENDPOINTS[role], {
    method: "POST",
    body: {
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      birth_date: payload.date_of_birth,
      gender: payload.gender.toUpperCase(),
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      terms_accepted: payload.terms,
    },
  });
}

export function loginUser(payload: LoginPayload): Promise<void> {
  return apiRequest<void>("/login", { method: "POST", body: payload });
}

export function verifyOtp(payload: { code: string }): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>("/email/otp/verify", { method: "POST", body: payload });
}

export function resendOtp(): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>("/email/otp/resend", { method: "POST" });
}

export function logoutUser(): Promise<void> {
  return apiRequest<void>("/logout", { method: "POST" });
}

/**
 * Ask the API to email a reset link.
 *
 * The server answers 200 whether or not the address has an account, so the
 * message is deliberately non-committal and must not be used to reveal that an
 * email is registered.
 */
export function requestPasswordReset(email: string): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>("/forgot-password", { method: "POST", body: { email } });
}

export type ResetPasswordPayload = {
  /** The `token` query parameter from the emailed link. */
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export function resetPassword(payload: ResetPasswordPayload): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>("/reset-password", { method: "POST", body: payload });
}
