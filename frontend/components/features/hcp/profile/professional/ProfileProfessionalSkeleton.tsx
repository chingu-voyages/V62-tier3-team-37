import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  skeletonKeys,
} from "@/components/features/shared/profile";

function SkeletonField() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <ProfileSkeleton className="h-2.5 w-20" />
      <ProfileSkeleton className="h-3.5 w-32" />
    </div>
  );
}

export function ProfileProfessionalSkeleton() {
  return (
    // Mirrors the collapsed card: highlights strip, practice fields and the
    // disclosure trigger. The revealed groups are not placeholdered - they are
    // one tap away and reserving them would double the height of every loading
    // state on the page.
    <ProfileCardSkeleton titleWidthClass="w-40">
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-accent p-4 @xl:grid-cols-4">
        {skeletonKeys(4).map((statKey) => (
          <div key={statKey} className="flex flex-col gap-1.5">
            <ProfileSkeleton className="h-2.5 w-16" />
            <ProfileSkeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="grid gap-x-6 gap-y-4 @xl:grid-cols-2">
          {skeletonKeys(6).map((fieldKey) => (
            <SkeletonField key={fieldKey} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <ProfileSkeleton className="h-8 w-28 rounded-md" />
      </div>
    </ProfileCardSkeleton>
  );
}
