import { ProfileCardSkeleton, ProfileSkeleton, skeletonKeys } from "../shared";

export function ProfileAvailabilitySectionSkeleton() {
  return (
    <ProfileCardSkeleton titleWidthClass="w-28">
      <ProfileSkeleton className="h-3 w-44" />

      <div className="@3xl:grid @3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] @3xl:items-center @3xl:gap-6">
        <div className="grid grid-cols-4 gap-1.5 justify-items-center @3xl:grid-cols-7">
          {skeletonKeys(7).map((dayKey) => (
            <ProfileSkeleton key={dayKey} className="h-7 w-full rounded-lg" />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-border bg-muted/60 px-3.5 py-1.5 @3xl:mt-0">
          {skeletonKeys(2).map((rowKey) => (
            <div key={rowKey} className="flex items-center justify-between gap-3 py-2.5">
              <ProfileSkeleton className="h-3 w-24" />
              <ProfileSkeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </ProfileCardSkeleton>
  );
}
