"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { useAdminDeskAction } from "@/hooks/use-admin-desk-action";
import { approveAdminAccess, declineAdminAccess } from "@/lib/api/admin-client";

/** Approve or decline one pending admin-access request. */
export function AccessRequestActions({ id }: { id: number }) {
  const { pending, error, run } = useAdminDeskAction();

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending !== null}
          onClick={() => run("approve", () => approveAdminAccess(id))}
        >
          {pending === "approve" ? "Saving…" : "Approve"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("decline", () => declineAdminAccess(id))}
        >
          {pending === "decline" ? "Saving…" : "Decline"}
        </Button>
      </div>
      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}
    </div>
  );
}
