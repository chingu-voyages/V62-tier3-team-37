import {
  ProfileSkeleton,
  ProfileSkeletonCircle,
  skeletonKeys,
} from "@/components/features/shared/profile";

export function ProfileOverviewSkeleton() {
  return (
    // Mirrors `ProfileOverview`'s shell: the same radius, the same container
    // query and the same panel split, so the loading state reserves exactly the
    // space the loaded card will take. The identity block is tinted with the
    // brand green instead of the neutral border grey, so it reads as the filled
    // panel the photo and name land in.
    <section className="@container overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="grid @3xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)]">
        <div className="flex flex-col bg-primary/10 p-6 @3xl:justify-center @3xl:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <ProfileSkeletonCircle className="size-20" />
            <div className="flex flex-wrap gap-2">
              <ProfileSkeleton className="h-8 w-28 rounded-lg bg-primary/15" />
              <ProfileSkeleton className="h-8 w-20 rounded-lg bg-primary/15" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <ProfileSkeleton className="h-6 w-48 rounded-md bg-primary/15" />
            <ProfileSkeleton className="h-4 w-32 rounded-md bg-primary/15" />
          </div>
        </div>

        <div className="p-6 @3xl:p-7">
          <div className="grid gap-x-8 gap-y-5 @xl:grid-cols-2">
            {skeletonKeys(6).map((rowKey) => (
              <div key={rowKey} className="flex flex-col gap-1.5">
                <ProfileSkeleton className="h-3 w-20" />
                <ProfileSkeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
