"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileSectionErrorProps = {
  message: string;
  retryLabel?: string;
  onRetry: () => void;
  className?: string;
};

/**
 * Error presentation for a single profile section. Keeps the failure contained
 * so sibling sections stay visible, and never surfaces the raw error.
 */
export function ProfileSectionError({
  message,
  retryLabel = "Retry",
  onRetry,
  className,
}: ProfileSectionErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <p className="type-body text-foreground">{message}</p>
      </div>

      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
