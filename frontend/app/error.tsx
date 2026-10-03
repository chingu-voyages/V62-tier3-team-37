"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";

/**
 * Route-level error boundary.
 *
 * `error` is intentionally not rendered: raw server messages can leak internals.
 * It is logged so the failure is observable — the five profile boundaries
 * previously swallowed every exception with no log and no report.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // `retry` is the stable prop as of next@16.3.0. `reset()` is deprecated.
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="type-h2 text-foreground">Something went wrong</h1>
        <div className="mt-4">
          <Callout tone="danger">
            An unexpected error occurred while loading this page. Please try again.
          </Callout>
        </div>
        {error.digest ? (
          <p className="mt-2 type-helper text-muted-foreground">
            Reference: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="mt-6">
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </div>
    </main>
  );
}
