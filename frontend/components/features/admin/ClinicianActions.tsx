"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDeskAction } from "@/hooks/use-admin-desk-action";
import { blockClinician, decideClinician, unblockClinician } from "@/lib/api/admin-client";

/**
 * Everything an admin can do to one clinician: confirm or decline their
 * credentials, and block or unblock the account.
 *
 * Both irreversible steps ask for confirmation inline, because this sits in a
 * column on the review page rather than in a list row. The decline step also
 * collects a reason, because that text is shown to the clinician on their own
 * profile and "declined" on its own tells them nothing to fix.
 */
export function ClinicianActions({
  id,
  blocked,
  canDecide,
}: {
  id: number;
  blocked: boolean;
  canDecide: boolean;
}) {
  const { pending, error, run } = useAdminDeskAction();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function resetDecision() {
    setConfirmBlock(false);
    setRejecting(false);
    setReason("");
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
            void run("reject", () => decideClinician(id, "REJECTED", reason), resetDecision);
          }}
        >
          <Label htmlFor="reject-reason">
            Reason for declining
            <span className="ml-2 font-normal text-muted-foreground">
              Shown on the clinician&apos;s profile
            </span>
          </Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            rows={3}
            placeholder="What is missing or does not match?"
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
              onClick={() =>
                run(
                  "block",
                  () => blockClinician(id),
                  () => setConfirmBlock(false),
                )
              }
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
