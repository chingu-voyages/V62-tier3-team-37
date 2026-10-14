"use client";

import { useMutation } from "@tanstack/react-query";
import { updatePatientProfile } from "@/lib/api/patient-profile-client";
import type {
  ApiPatientProfileUpdateResponse,
  UpdatePatientProfileInput,
} from "@/types/patient-profile-api";
import { useServerRefresh } from "./use-server-refresh";

/**
 * Mutations for `PATCH /api/patient/profile`.
 *
 * The same contract as the HCP profile mutations, which is why both behave
 * identically after a save: re-run the Server Components, let the memoised DAL
 * response refresh, reconcile every section from that one read.
 */
export function useUpdatePatientProfileMutation() {
  const refresh = useServerRefresh();

  return useMutation({
    mutationFn: (input: UpdatePatientProfileInput) => updatePatientProfile(input),
    onSuccess: (_response: ApiPatientProfileUpdateResponse) => refresh(),
  });
}
