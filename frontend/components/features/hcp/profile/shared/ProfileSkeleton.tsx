import { cn } from "@/lib/utils";

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** Stable keys for fixed-length placeholder lists, so skeletons avoid array indices. */
export function skeletonKeys(count: number) {
  return KEY_ALPHABET.slice(0, count).split("");
}

type ProfileSkeletonProps = {
  className?: string;
};

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-border/70", className)} />
  );
}

type ProfileSkeletonCircleProps = {
  className?: string;
};

export function ProfileSkeletonCircle({ className }: ProfileSkeletonCircleProps) {
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
