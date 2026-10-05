"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updatePatientProfile, type UpdatePatientProfileInput } from "@/lib/api/patient-client";

export function useUpdatePatientProfileMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdatePatientProfileInput) => updatePatientProfile(input),
    onSuccess: () => {
      router.refresh();
    },
  });
}
