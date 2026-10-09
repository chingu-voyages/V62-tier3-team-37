import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  skeletonKeys,
} from "@/components/features/shared/profile";

/** Mirrors the allergy rows: name over reaction, badge at the end. */
export function PatientAllergiesSkeleton() {
  return (
    <ProfileCardSkeleton titleWidthClass="w-24">
      <div className="flex flex-col divide-y divide-border">
        {skeletonKeys(3).map((rowKey) => (
          <div
            key={rowKey}
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex flex-col gap-1.5">
              <ProfileSkeleton className="h-3.5 w-28" />
              <ProfileSkeleton className="h-3 w-40" />
            </div>
            <ProfileSkeleton className="h-6 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </ProfileCardSkeleton>
  );
}
