import {
  ProfileCardSkeleton,
  ProfileSkeleton,
  ProfileSkeletonLines,
  skeletonKeys,
} from "@/components/features/shared/profile";

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
    // One card, like the component it stands in for. It used to render three
    // separate card shells, so the loading state had a different structure from
    // the loaded content and the page jumped as each one resolved.
    <ProfileCardSkeleton titleWidthClass="w-36" action="none">
      <div className="flex flex-col divide-y divide-border [&>section]:pt-5 [&>section:first-child]:pt-0">
        <section>
          <ProfileSkeleton className="h-2.5 w-24" />
          <div className="mt-3">
            <SkeletonPills count={3} />
          </div>
        </section>

        <section>
          <ProfileSkeleton className="h-2.5 w-32" />
          <div className="mt-3">
            <SkeletonPills count={2} />
          </div>
        </section>

        <section>
          <ProfileSkeleton className="h-2.5 w-28" />
          <ProfileSkeletonLines
            count={3}
            widths={["w-full", "w-11/12", "w-3/4"]}
            className="mt-3"
          />
        </section>
      </div>
    </ProfileCardSkeleton>
  );
}
