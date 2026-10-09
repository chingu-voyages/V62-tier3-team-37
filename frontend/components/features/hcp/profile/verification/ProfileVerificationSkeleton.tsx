import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  skeletonKeys,
} from "@/components/features/shared/profile";

export function ProfileVerificationSkeleton() {
  return (
    <ProfileCardSkeleton action="badge" titleWidthClass="w-32">
      <ProfileSkeleton className="h-3 w-40" />

      <div className="mt-3 flex flex-col gap-3">
        {skeletonKeys(5).map((rowKey) => (
          <div key={rowKey} className="flex items-center justify-between gap-3">
            <ProfileSkeleton className="size-4 shrink-0 rounded-full" />
            <ProfileSkeleton className="h-3 w-28" />
            <ProfileSkeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <ProfileSkeleton className="mt-4 h-3 w-32" />
    </ProfileCardSkeleton>
  );
}
