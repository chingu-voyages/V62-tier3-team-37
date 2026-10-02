import { ProfileSkeletonCircle, ProfileSkeletonLines } from "../shared";

export function ProfileOverviewSkeleton() {
  return (
    <section className="rounded-2xl border border-secondary/20 bg-accent p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <ProfileSkeletonCircle className="size-16 sm:size-20" />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <ProfileSkeletonCircle className="h-6 w-48 rounded-md" />
            <ProfileSkeletonCircle className="h-4 w-32 rounded-md" />
          </div>

          <ProfileSkeletonLines
            count={3}
            widths={["w-full", "w-4/5", "w-3/5"]}
            className="max-w-md"
          />
        </div>
      </div>
    </section>
  );
}
