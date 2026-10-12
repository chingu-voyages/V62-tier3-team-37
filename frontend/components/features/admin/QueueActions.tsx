"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  approveAdminAccess,
  blockPatient,
  declineAdminAccess,
  dismissReport,
  resolveReport,
  unblockPatient,
} from "@/lib/api/admin-client";
import { getApiErrorMessage } from "@/lib/api/client";

function useDeskAction() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, task: () => Promise<unknown>) {
    setPending(action);
    setError(null);
    try {
      await task();
      router.refresh();
    } catch (cause) {
      setError(getApiErrorMessage(cause, "That update did not save."));
    } finally {
      setPending(null);
    }
  }

  return { pending, error, run };
}

export function AccessRequestActions({ id }: { id: number }) {
  const { pending, error, run } = useDeskAction();

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

export function PatientBlockButton({ id, blocked }: { id: number; blocked: boolean }) {
  const { pending, error, run } = useDeskAction();
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
            onClick={() => run("toggle", () => blockPatient(id))}
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

export function ReportActions({ id, status }: { id: number; status: string }) {
  const { pending, error, run } = useDeskAction();

  if (status !== "OPEN") {
    return <p className="type-helper text-muted-foreground">{status === "RESOLVED" ? "Resolved" : "Dismissed"}</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending !== null} onClick={() => run("resolve", () => resolveReport(id))}>
          {pending === "resolve" ? "Saving…" : "Resolve"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("dismiss", () => dismissReport(id))}
        >
          {pending === "dismiss" ? "Saving…" : "Dismiss"}
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
