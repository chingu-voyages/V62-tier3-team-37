import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card chrome, exported so loading skeletons render the exact same box as the
 * loaded content. It used to be copy-pasted into four skeleton files as a literal
 * string, so a change to the card's padding silently desynced the skeleton from
 * the component it stands in for.
 */
export const PROFILE_CARD_SHELL_CLASS =
  "@container flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5";

type ProfileCardProps = {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function ProfileCard({
  title,
  icon: Icon,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: ProfileCardProps) {
  return (
    <section className={cn(PROFILE_CARD_SHELL_CLASS, className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
          >
            <Icon className="size-4" />
          </span>
          <h2 className="type-h4 text-foreground">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div className={cn("mt-4 min-w-0 flex-1", bodyClassName)}>{children}</div>

      {footer ? <div className="mt-4 min-w-0">{footer}</div> : null}
    </section>
  );
}
