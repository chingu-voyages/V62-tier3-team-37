import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  skeletonKeys,
} from "@/components/features/shared/profile";

/** Mirrors the highlights strip `PatientHealthProfile` renders. */
export function PatientHealthProfileSkeleton() {
  return (
    <ProfileCardSkeleton titleWidthClass="w-36">
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-accent p-4 @xl:grid-cols-4">
        {skeletonKeys(4).map((statKey) => (
          <div key={statKey} className="flex flex-col gap-1.5">
            <ProfileSkeleton className="h-2.5 w-16" />
            <ProfileSkeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      <ProfileSkeleton className="mt-4 h-3 w-64" />
    </ProfileCardSkeleton>
  );
}
