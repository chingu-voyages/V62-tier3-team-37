"use client";

import { useRouter } from "next/navigation";

/**
 * Reconcile the page after a write.
 *
 * Both profile screens read through `lib/dal`, which memoises the API response per
 * request with React `cache`. So a save is finished by re-running the Server
 * Components: they re-read one response and every section is reconciled from that
 * single source of truth. There is no React Query cache entry to write, because
 * nothing on these pages ever reads one.
 *
 * Shared by the HCP, patient and photo mutations so all three behave identically.
 */
export function useServerRefresh() {
  const router = useRouter();

  return () => {
    router.refresh();
  };
}
