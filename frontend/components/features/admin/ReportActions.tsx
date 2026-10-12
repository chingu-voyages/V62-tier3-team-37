"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { useAdminDeskAction } from "@/hooks/use-admin-desk-action";
import { dismissReport, resolveReport } from "@/lib/api/admin-client";

/**
 * Resolve or dismiss a report about a clinician.
 *
 * A decided report has no actions left, so it renders as its outcome instead of
 * two disabled buttons — the list would otherwise be mostly dead controls.
 */
export function ReportActions({ id, status }: { id: number; status: string }) {
  const { pending, error, run } = useAdminDeskAction();

  if (status !== "OPEN") {
    return (
      <p className="type-helper text-muted-foreground">
        {status === "RESOLVED" ? "Resolved" : "Dismissed"}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending !== null}
          onClick={() => run("resolve", () => resolveReport(id))}
        >
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
