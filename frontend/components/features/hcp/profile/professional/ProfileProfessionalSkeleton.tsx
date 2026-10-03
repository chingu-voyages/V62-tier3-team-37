import { ProfileCardSkeleton, ProfileSkeleton, skeletonKeys } from "../shared";

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
    // `@lg:` below resolves against the card's own `@container`. The skeleton
    // used to hardcode the shell class without `@container`, so the two-column
    // breakpoint never matched and the loading state had a different layout from
    // the loaded content it stood in for.
    <ProfileCardSkeleton titleWidthClass="w-40">
      <div className="grid grid-cols-1 gap-6 @lg:grid-cols-2">
        <SkeletonColumn rows={5} />
        <SkeletonColumn rows={5} />
      </div>
    </ProfileCardSkeleton>
  );
}
