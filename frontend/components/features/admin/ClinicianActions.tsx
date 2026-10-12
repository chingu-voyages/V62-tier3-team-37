"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { blockClinician, decideClinician, unblockClinician } from "@/lib/api/admin-client";
import { getApiErrorMessage } from "@/lib/api/client";

export function ClinicianActions({
  id,
  blocked,
  canDecide,
}: {
  id: number;
  blocked: boolean;
  canDecide: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function run(action: string, task: () => Promise<unknown>) {
    setPending(action);
    setError(null);
    try {
      await task();
      setConfirmBlock(false);
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch (cause) {
      setError(getApiErrorMessage(cause, "That update did not save."));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {canDecide ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={pending !== null}
            onClick={() => run("verify", () => decideClinician(id, "VERIFIED"))}
          >
            {pending === "verify" ? "Saving…" : "Confirm request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending !== null}
            onClick={() => setRejecting((open) => !open)}
          >
            Decline
          </Button>
        </div>
      ) : null}

      {rejecting ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run("reject", () => decideClinician(id, "REJECTED", reason));
          }}
        >
          <label htmlFor="reject-reason" className="type-helper text-muted-foreground">
            This note appears on the clinician's profile
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            rows={3}
            className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 type-body outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          />
          <Button type="submit" variant="outline" disabled={pending !== null}>
            {pending === "reject" ? "Saving…" : "Decline request"}
          </Button>
        </form>
      ) : null}

      {blocked ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("unblock", () => unblockClinician(id))}
        >
          {pending === "unblock" ? "Saving…" : "Unblock"}
        </Button>
      ) : confirmBlock ? (
        <div className="rounded-xl bg-destructive/10 px-4 py-3">
          <p className="type-body text-foreground">
            This person will disappear from search and will not be able to sign in.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmBlock(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending !== null}
              onClick={() => run("block", () => blockClinician(id))}
            >
              {pending === "block" ? "Blocking…" : "Block clinician"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="destructive" onClick={() => setConfirmBlock(true)}>
          Block clinician
        </Button>
      )}

      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}
    </div>
  );
}
