"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api/client";

type DeskAction = {
  /** The button currently running, so only it shows "Saving…". `null` when idle. */
  pending: string | null;
  error: string | null;
  run: (action: string, task: () => Promise<unknown>, onDone?: () => void) => Promise<void>;
};

/**
 * The one place admin writes are driven from.
 *
 * Every admin desk action — approving a request, blocking a patient, deciding a
 * clinician, resolving a report — is the same three steps: mark the button busy,
 * call the API, then re-run the Server Components so the lists behind it are
 * reconciled from one fresh response. That lived inline in two components, which
 * is how the two drifted: one cleared its confirm/reject state on success and
 * the other did not.
 *
 * `onDone` is for the local UI a successful write should reset, such as a
 * confirmation step or a typed reason. It runs before the refresh so the user
 * never sees the old state flash back.
 */
export function useAdminDeskAction(): DeskAction {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, task: () => Promise<unknown>, onDone?: () => void) {
    setPending(action);
    setError(null);
    try {
      await task();
      onDone?.();
      router.refresh();
    } catch (cause) {
      setError(getApiErrorMessage(cause, "That update did not save."));
    } finally {
      setPending(null);
    }
  }

  return { pending, error, run };
}
