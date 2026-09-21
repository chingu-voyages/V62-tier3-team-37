import type { SignupRole } from "@/components/features/auth/SignupRoleSwitch";
import { type ApiMessageResponse, apiRequest } from "@/lib/api";

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export function registerUser(
  role: SignupRole,
  payload: RegisterPayload,
): Promise<ApiMessageResponse> {
  const endpoint = role === "HCP" ? "/register/hcp" : "/register/patient";
  return apiRequest<ApiMessageResponse>(endpoint, {
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
