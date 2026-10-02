import { ProfileSkeleton, ProfileSkeletonCircle, skeletonKeys } from "../shared";

export function ProfileAvailabilitySectionSkeleton() {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileSkeletonCircle className="size-8" />
          <ProfileSkeleton className="h-4 w-28" />
        </div>
        <ProfileSkeletonCircle className="size-8" />
      </header>

      <ProfileSkeleton className="mt-4 h-3 w-44" />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {skeletonKeys(7).map((dayKey) => (
          <ProfileSkeleton key={dayKey} className="h-7 w-12 rounded-lg" />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-border bg-muted/60 px-3.5 py-3">
        {skeletonKeys(2).map((rowKey) => (
          <div key={rowKey} className="flex items-center justify-between gap-3">
            <ProfileSkeleton className="h-3 w-24" />
            <ProfileSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}
