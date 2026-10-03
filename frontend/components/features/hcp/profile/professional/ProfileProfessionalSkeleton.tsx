import { ProfileSkeleton, ProfileSkeletonCircle, skeletonKeys } from "../shared";

function SkeletonColumn({ rows }: { rows: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {skeletonKeys(rows).map((rowKey) => (
        <div key={rowKey} className="flex flex-col gap-1.5">
          <ProfileSkeleton className="h-2.5 w-20" />
          <ProfileSkeleton className="h-3.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ProfileProfessionalSkeleton() {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileSkeletonCircle className="size-8" />
          <ProfileSkeleton className="h-4 w-40" />
        </div>
        <ProfileSkeletonCircle className="size-8" />
      </header>

      <div className="mt-4 grid grid-cols-1 gap-6 @lg:grid-cols-2">
        <SkeletonColumn rows={5} />
        <SkeletonColumn rows={5} />
      </div>
    </section>
  );
}
