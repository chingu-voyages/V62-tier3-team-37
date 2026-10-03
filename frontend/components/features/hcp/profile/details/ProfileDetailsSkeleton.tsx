import {
  ProfileCardSkeleton,
  ProfileSkeleton,
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

export function ProfileDetailsSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ProfileCardSkeleton action="none">
        <SkeletonPills count={3} />
      </ProfileCardSkeleton>

      <ProfileCardSkeleton action="none">
        <SkeletonPills count={3} />
      </ProfileCardSkeleton>

      <ProfileCardSkeleton>
        <ProfileSkeletonLines count={4} widths={["w-full", "w-11/12", "w-3/4"]} />
      </ProfileCardSkeleton>
    </div>
  );
}
