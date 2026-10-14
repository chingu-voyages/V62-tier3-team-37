import { cn } from "@/lib/utils";

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

/**
 * Stable keys for fixed-length placeholder lists, so skeletons avoid array
 * indices. Throws past the alphabet size rather than silently returning fewer
 * keys than asked for, which is what the old `slice` implementation did.
 */
export function skeletonKeys(count: number): string[] {
  if (count < 0 || !Number.isInteger(count)) {
    throw new RangeError(`skeletonKeys expects a non-negative integer, received ${count}`);
  }
  if (count > KEY_ALPHABET.length) {
    throw new RangeError(`skeletonKeys supports at most ${KEY_ALPHABET.length} items`);
  }
  return KEY_ALPHABET.slice(0, count);
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-border/70", className)} />
  );
}

export function ProfileSkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse shrink-0 rounded-full bg-border/70", className)}
    />
  );
}

type ProfileSkeletonLinesProps = {
  count: number;
  className?: string;
  /** Width classes applied per line; the last entry repeats if fewer are given. */
  widths?: string[];
};

export function ProfileSkeletonLines({ count, className, widths }: ProfileSkeletonLinesProps) {
  const pattern = widths?.length ? widths : ["w-full", "w-5/6", "w-2/3"];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {skeletonKeys(count).map((lineKey, position) => (
        <ProfileSkeleton
          key={lineKey}
          className={cn("h-3", pattern[Math.min(position, pattern.length - 1)])}
        />
      ))}
    </div>
  );
}
