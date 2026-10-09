import { Skeleton, SkeletonCircle, skeletonKeys } from "@/components/ui/skeleton";

type HCPListSkeletonProps = {
  /** How many placeholder rows to draw. Defaults to one page. */
  count?: number;
};

/**
 * Placeholder rows for the doctor directory while a request is in flight.
 *
 * Mirrors `HCPListItem`'s layout — avatar, name, chips, meta line, actions — so
 * the list does not jump when the real rows arrive. This is the *pending* state
 * only; `HCPEmptyState` covers a resolved-but-empty list.
 */
export function HCPListSkeleton({ count = 4 }: HCPListSkeletonProps) {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-4">
      {skeletonKeys(count).map((key) => (
        <li
          key={key}
          className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border sm:flex-row sm:items-center"
        >
          <SkeletonCircle className="size-14 shrink-0" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-44" />
              <SkeletonCircle className="size-5" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <Skeleton className="mt-2.5 h-4 w-36" />

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}
