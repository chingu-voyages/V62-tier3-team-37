"use client";

import { useMutation } from "@tanstack/react-query";
import {
  deleteHcpAvailabilitySlot,
  replaceHcpAvailability,
  updateHcpProfile,
} from "@/lib/api/hcp-profile-client";
import type {
  ApiHcpProfileResponse,
  ReplaceAvailabilityInput,
  UpdateHcpProfileInput,
} from "@/types/hcp-profile-api";
import { useServerRefresh } from "./use-server-refresh";

/**
 * Mutations for `/api/hcp/profile`.
 *
 * A save finishes with `router.refresh()` (see `useServerRefresh`): the profile
 * sections are Server Components that read through `lib/dal/hcp`, not `useQuery`,
 * so there is deliberately no React Query cache entry to seed. The previous version
 * wrote the API payload into `hcpKeys.profile.*` and nothing ever read those keys,
 * which looked like optimistic caching while actually doing nothing.
 *
 * The photo mutations are not here: `/api/profile/photo` serves any authenticated
 * user, so they live in `use-profile-photo-mutations` alongside the shared
 * `ProfilePhotoControl` that uses them.
 */
export function useUpdateHcpProfileMutation() {
  const refresh = useServerRefresh();

  return useMutation({
    mutationFn: (input: UpdateHcpProfileInput) => updateHcpProfile(input),
    onSuccess: (_response: ApiHcpProfileResponse) => refresh(),
  });
}

export function useReplaceAvailabilityMutation() {
  const refresh = useServerRefresh();

  return useMutation({
    mutationFn: (input: ReplaceAvailabilityInput) => replaceHcpAvailability(input),
    onSuccess: refresh,
  });
}

export function useDeleteAvailabilitySlotMutation() {
  const refresh = useServerRefresh();

  return useMutation({
    mutationFn: (slotId: number) => deleteHcpAvailabilitySlot(slotId),
    onSuccess: refresh,
  });
}
