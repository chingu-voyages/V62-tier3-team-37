import { ProfileSkeletonCircle, ProfileSkeletonLines } from "../shared";

export function ProfileOverviewSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ProfileSkeletonCircle className="size-24" />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <ProfileSkeletonCircle className="h-8 w-56 rounded-md" />
            <ProfileSkeletonCircle className="h-4 w-32 rounded-md" />
            <ProfileSkeletonCircle className="h-4 w-64 rounded-md" />
          </div>

          <ProfileSkeletonLines count={2} widths={["w-2/3", "w-1/2"]} className="max-w-md" />
        </div>
      </div>
    </section>
  );
}
