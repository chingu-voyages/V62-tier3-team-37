"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { useAdminDeskAction } from "@/hooks/use-admin-desk-action";
import { blockPatient, unblockPatient } from "@/lib/api/admin-client";

/**
 * Block or unblock a patient account.
 *
 * Blocking is the one desk action that cannot be undone from the same click, so
 * it asks first. The confirmation is inline rather than a dialog because it
 * always sits in a list row and there is no room to float a dialog over.
 */
export function PatientBlockButton({ id, blocked }: { id: number; blocked: boolean }) {
  const { pending, error, run } = useAdminDeskAction();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2">
      {blocked ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("toggle", () => unblockPatient(id))}
        >
          {pending === "toggle" ? "Saving…" : "Unblock"}
        </Button>
      ) : confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending !== null}
            onClick={() =>
              run(
                "toggle",
                () => blockPatient(id),
                () => setConfirming(false),
              )
            }
          >
            {pending === "toggle" ? "Saving…" : "Block patient"}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>
          Block
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
