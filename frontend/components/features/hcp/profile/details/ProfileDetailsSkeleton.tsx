import { ProfileCardSkeleton, ProfileSkeleton, ProfileSkeletonLines, skeletonKeys } from "../shared";

export function ProfileDetailsSkeleton() {
  return (
    <ProfileCardSkeleton className="h-full">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {skeletonKeys(2).map((pillKey) => (
            <ProfileSkeleton key={pillKey} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {skeletonKeys(2).map((pillKey) => (
            <ProfileSkeleton key={pillKey} className="h-7 w-24 rounded-lg" />
          ))}
        </div>
        <ProfileSkeletonLines count={3} widths={["w-full", "w-11/12", "w-3/4"]} />
      </div>
    </ProfileCardSkeleton>
  );
}
