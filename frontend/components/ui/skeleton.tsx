import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block.
 *
 * A flat `animate-pulse` reads as a grey box rather than as content loading, so
 * the gradient sweeps instead. The gradient lives in inline style because
 * Tailwind cannot build a gradient from a CSS variable at an arbitrary angle.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--border) 0%, var(--accent) 45%, var(--border) 90%)",
        backgroundSize: "200% 100%",
      }}
      className={cn("animate-pulse rounded-md", className)}
    />
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-full", className)} />;
}

/** Stable keys for fixed-length placeholder lists, so no array indices. */
export function skeletonKeys(count: number): string[] {
  if (count < 0 || !Number.isInteger(count)) {
    throw new RangeError(`skeletonKeys expects a non-negative integer, received ${count}`);
  }

  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

  if (count > alphabet.length) {
    throw new RangeError(`skeletonKeys supports at most ${alphabet.length} items`);
  }

  return alphabet.slice(0, count);
}
