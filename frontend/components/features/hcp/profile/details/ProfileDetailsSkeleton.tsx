import {
  ProfileSkeleton,
  ProfileSkeletonCircle,
  ProfileSkeletonLines,
  skeletonKeys,
} from "../shared";

function SkeletonPills({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skeletonKeys(count).map((pillKey) => (
        <ProfileSkeleton key={pillKey} className="h-7 w-24 rounded-lg" />
      ))}
    </div>
  );
}

function SkeletonCard({ pillCount, textLines }: { pillCount?: number; textLines?: number }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileSkeletonCircle className="size-8" />
          <ProfileSkeleton className="h-4 w-28" />
        </div>
        {pillCount ? null : <ProfileSkeletonCircle className="size-8" />}
      </header>

      <div className="mt-4">
        {pillCount ? (
          <SkeletonPills count={pillCount} />
        ) : (
          <ProfileSkeletonLines count={textLines ?? 3} widths={["w-full", "w-11/12", "w-3/4"]} />
        )}
      </div>
    </section>
  );
}

export function ProfileDetailsSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SkeletonCard pillCount={3} />
      <SkeletonCard pillCount={3} />
      <SkeletonCard textLines={4} />
    </div>
  );
}
