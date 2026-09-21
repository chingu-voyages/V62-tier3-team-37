"use client";

import { useMutation } from "@tanstack/react-query";
import type { SignupRole } from "@/components/features/auth/SignupRoleSwitch";
import {
  type LoginPayload,
  loginUser,
  logoutUser,
  type RegisterPayload,
  registerUser,
  resendOtp,
  verifyOtp,
} from "@/lib/auth-api";

type RegisterInput = {
  role: SignupRole;
  payload: RegisterPayload;
};

export function useRegisterMutation() {
  return useMutation({
    mutationFn: ({ role, payload }: RegisterInput) => registerUser(role, payload),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: { code: string }) => verifyOtp(payload),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: () => resendOtp(),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => logoutUser(),
  });
}
