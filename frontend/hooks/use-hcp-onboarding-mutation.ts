"use client";

import { useMutation } from "@tanstack/react-query";
import { type HcpOnboardingPayload, submitHcpOnboarding } from "@/lib/hcp-api";

export function useHcpOnboardingMutation() {
  return useMutation({
    mutationFn: (payload: HcpOnboardingPayload) => submitHcpOnboarding(payload),
  });
}
