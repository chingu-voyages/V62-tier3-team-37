import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PROFILE_CARD_SHELL_CLASS } from "./ProfileCard";
import { ProfileSkeleton, ProfileSkeletonCircle } from "./ProfileSkeleton";

type ProfileCardSkeletonProps = {
  /** Width of the title placeholder next to the leading icon. */
  titleWidthClass?: string;
  /** Shape of the trailing element, mirroring each section's real action slot. */
  action?: "circle" | "badge" | "none";
  children?: ReactNode;
  className?: string;
};

/**
 * Loading placeholder for a `ProfileCard`.
 *
 * Four of the five section skeletons duplicated the same card shell and header
 * block as literal strings, differing only in a title width and one ternary —
 * exactly the props this component takes. Keeping the shell here means a change to
 * the card's padding or radius can no longer leave the loading state behind.
 */
export function ProfileCardSkeleton({
  titleWidthClass = "w-28",
  action = "circle",
  children,
  className,
}: ProfileCardSkeletonProps) {
  return (
    <section className={cn(PROFILE_CARD_SHELL_CLASS, className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileSkeletonCircle className="size-8" />
          <ProfileSkeleton className={cn("h-4", titleWidthClass)} />
        </div>

        {action === "circle" ? <ProfileSkeletonCircle className="size-8" /> : null}
        {action === "badge" ? <ProfileSkeleton className="h-6 w-24 rounded-lg" /> : null}
      </header>

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
