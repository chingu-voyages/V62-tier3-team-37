import { ProfileSkeleton, ProfileSkeletonLines, skeletonKeys } from "../shared";

export function ProfileVerificationSkeleton() {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileSkeleton className="size-8 shrink-0 rounded-full" />
          <ProfileSkeleton className="h-4 w-32" />
        </div>
        <ProfileSkeleton className="h-6 w-24 rounded-lg" />
      </header>

      <div className="mt-4 flex flex-col gap-3">
        {skeletonKeys(5).map((rowKey) => (
          <div key={rowKey} className="flex items-center justify-between gap-3">
            <ProfileSkeleton className="size-4 shrink-0 rounded-full" />
            <ProfileSkeleton className="h-3 w-28" />
            <ProfileSkeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <ProfileSkeletonLines count={1} widths={["w-32"]} className="mt-4" />
    </section>
  );
}
