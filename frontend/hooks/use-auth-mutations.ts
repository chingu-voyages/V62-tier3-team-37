"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser, logoutUser, registerUser, resendOtp, verifyOtp } from "@/lib/api/auth-client";
import { userKeys } from "@/lib/query-keys";
import type { LoginPayload, RegisterPayload, SignupRole } from "@/types/auth";

type RegisterInput = {
  role: SignupRole;
  payload: RegisterPayload;
};

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, payload }: RegisterInput) => registerUser(role, payload),
    onSuccess: () => {
      // A new account invalidates anything cached about the previous session.
      queryClient.clear();
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: () => {
      queryClient.setQueryData(userKeys.current(), null);
      queryClient.removeQueries({ queryKey: userKeys.all });
    },
  });
}

export function useVerifyOtpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { code: string }) => verifyOtp(payload),
    onSuccess: () => {
      // Verification changed the authoritative `email_verified_at` the guards read.
      queryClient.removeQueries({ queryKey: userKeys.all });
    },
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: () => resendOtp(),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      // Wipe every cached response, not just the user: none of it survives logout.
      queryClient.clear();
    },
  });
}
