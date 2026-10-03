import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  ProfileSkeletonLines,
  skeletonKeys,
} from "../shared";

export function ProfileVerificationSkeleton() {
  return (
    <ProfileCardSkeleton action="badge" titleWidthClass="w-32">
      <div className="flex flex-col gap-3">
        {skeletonKeys(5).map((rowKey) => (
          <div key={rowKey} className="flex items-center justify-between gap-3">
            <ProfileSkeleton className="size-4 shrink-0 rounded-full" />
            <ProfileSkeleton className="h-3 w-28" />
            <ProfileSkeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <ProfileSkeletonLines count={1} widths={["w-32"]} className="mt-4" />
    </ProfileCardSkeleton>
  );
}
