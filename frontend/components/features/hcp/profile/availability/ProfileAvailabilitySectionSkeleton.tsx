import { ProfileCardSkeleton, ProfileSkeleton, skeletonKeys } from "../shared";

export function ProfileAvailabilitySectionSkeleton() {
  return (
    <ProfileCardSkeleton>
      <ProfileSkeleton className="h-3 w-44" />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {skeletonKeys(7).map((dayKey) => (
          <ProfileSkeleton key={dayKey} className="h-7 w-12 rounded-lg" />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-border bg-muted/60 px-3.5 py-3">
        {skeletonKeys(2).map((rowKey) => (
          <div key={rowKey} className="flex items-center justify-between gap-3">
            <ProfileSkeleton className="h-3 w-24" />
            <ProfileSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </ProfileCardSkeleton>
  );
}
