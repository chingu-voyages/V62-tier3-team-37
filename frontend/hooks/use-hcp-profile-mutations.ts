"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  deleteHcpAvailabilitySlot,
  deleteHcpProfilePhoto,
  replaceHcpAvailability,
  updateHcpProfile,
  uploadHcpProfilePhoto,
} from "@/lib/api/hcp-profile-client";
import { userKeys } from "@/lib/query-keys";
import type {
  ApiHcpProfileResponse,
  ApiProfilePhotoResponse,
  ReplaceAvailabilityInput,
  UpdateHcpProfileInput,
} from "@/types/hcp-profile-api";

/**
 * Mutations for `/api/hcp/profile`.
 *
 * The profile sections are Server Components that read through `lib/dal/hcp`, not
 * `useQuery`. So there is deliberately no React Query cache entry to seed here: the
 * previous version wrote the API payload into `hcpKeys.profile.*` and nothing ever
 * read those keys, which looked like optimistic caching while actually doing
 * nothing. `router.refresh()` re-runs the server components, re-reads the DAL
 * (memoised per request) and reconciles every section from one source of truth.
 */
function useProfileRefresh() {
  const router = useRouter();

  return () => {
    router.refresh();
  };
}

export function useUpdateHcpProfileMutation() {
  const refresh = useProfileRefresh();

  return useMutation({
    mutationFn: (input: UpdateHcpProfileInput) => updateHcpProfile(input),
    onSuccess: (_response: ApiHcpProfileResponse) => refresh(),
  });
}

export function useReplaceAvailabilityMutation() {
  const refresh = useProfileRefresh();

  return useMutation({
    mutationFn: (input: ReplaceAvailabilityInput) => replaceHcpAvailability(input),
    onSuccess: refresh,
  });
}

export function useDeleteAvailabilitySlotMutation() {
  const refresh = useProfileRefresh();

  return useMutation({
    mutationFn: (slotId: number) => deleteHcpAvailabilitySlot(slotId),
    onSuccess: refresh,
  });
}

export function useUploadProfilePhotoMutation() {
  const queryClient = useQueryClient();
  const refresh = useProfileRefresh();

  return useMutation({
    mutationFn: (file: File) => uploadHcpProfilePhoto(file),
    onSuccess: (_response: ApiProfilePhotoResponse) => {
      // The avatar is the one place a cached copy could survive a refresh, so drop
      // any user-scoped entry rather than let a stale photo linger.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      refresh();
    },
  });
}

export function useDeleteProfilePhotoMutation() {
  const queryClient = useQueryClient();
  const refresh = useProfileRefresh();

  return useMutation({
    mutationFn: () => deleteHcpProfilePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      refresh();
    },
  });
}
