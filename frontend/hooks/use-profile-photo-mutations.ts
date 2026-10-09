"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadProfilePhoto } from "@/lib/api/profile-photo-client";
import { hcpKeys, userKeys } from "@/lib/query-keys";
import type { ApiProfilePhotoResponse } from "@/types/profile-api";
import { useServerRefresh } from "./use-server-refresh";

/**
 * Photo upload for `/api/profile/photo`.
 *
 * Role-agnostic on purpose: the endpoint is not scoped to a role and both profile
 * screens read the same `users.profile_photo_path` column, so this lives once
 * instead of being copied into a hooks file per role.
 *
 * There is no delete mutation here because the UI has no way to reach it: the
 * control's only destructive action is discarding an unsaved pick, and a stored
 * photo is replaced rather than deleted. `DELETE /api/profile/photo` still exists
 * in the API and is untouched.
 */
export function useUploadProfilePhotoMutation() {
  const queryClient = useQueryClient();
  const refresh = useServerRefresh();

  return useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file),
    onSuccess: (_response: ApiProfilePhotoResponse) => {
      // Every cached copy of this person's photo has to go, and there are two
      // places it lives:
      //
      // - `userKeys` feeds the navbar avatar, which reads `/api/user`
      // - `hcpKeys.lists` feeds the doctor directory, where a clinician's photo is
      //   shown to every patient browsing
      //
      // `router.refresh()` alone is not enough: it re-runs the Server Components but
      // leaves the client cache holding the old URL, so an already-open directory
      // would keep showing the previous photo. Invalidating is free when the query is
      // not mounted - it only refetches what is actually on screen.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: hcpKeys.lists() });
      refresh();
    },
  });
}
