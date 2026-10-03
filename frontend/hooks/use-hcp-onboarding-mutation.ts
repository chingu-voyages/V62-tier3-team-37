"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type HcpOnboardingPayload, submitHcpOnboarding } from "@/lib/api/hcp-client";
import { userKeys } from "@/lib/query-keys";

export function useHcpOnboardingMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: HcpOnboardingPayload) => submitHcpOnboarding(payload),
    onSuccess: () => {
      // Submitting changes `verification.status` on the profile, which the profile
      // sections read through `lib/dal` - not through the query cache. Refreshing
      // is what actually updates them; invalidating a profile key nothing queries
      // (as this previously did) updated nothing.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      router.refresh();
    },
  });
}
