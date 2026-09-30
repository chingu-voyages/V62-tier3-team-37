import { cn } from "cn";
import { CircleAlert, Info, type LucideIcon } from "lucide-react";
import type * as React from "react";

/**
 * Inline message used for informational and error copy inside forms.
 *
 * `info` is the HealthHub Accent Light surface (#ECFDF5) with a Secondary
 * Green hairline and accent chip — deliberately soft so it never reads as a
 * warning. `danger` is reserved for real submission errors and keeps
 * `role="alert"` semantics for screen readers.
 */
const CALLOUT_TONES = {
  info: {
    container: "border-secondary/25 bg-accent",
    icon: "bg-secondary/15 text-primary",
    copy: "text-muted-foreground",
    defaultIcon: Info,
  },
  danger: {
    container: "border-destructive/25 bg-destructive/10",
    icon: "bg-destructive/15 text-destructive",
    copy: "text-destructive",
    defaultIcon: CircleAlert,
  },
} as const satisfies Record<
  string,
  {
    container: string;
    icon: string;
    copy: string;
    defaultIcon: LucideIcon;
  }
>;

type CalloutProps = React.ComponentProps<"div"> & {
  tone?: keyof typeof CALLOUT_TONES;
  /** Pass `null` to render the message without an icon. */
  icon?: LucideIcon | null;
  title?: React.ReactNode;
};

function Callout({ tone = "info", icon, title, className, children, ...props }: CalloutProps) {
  const config = CALLOUT_TONES[tone];
  const Icon = icon === null ? null : (icon ?? config.defaultIcon);

  return (
    <div
      data-slot="callout"
      data-tone={tone}
      className={cn(
        "flex gap-3 rounded-lg border px-3.5 py-3 sm:px-4 sm:py-3.5",
        config.container,
        className,
      )}
      {...props}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            config.icon,
            "flex w-[8%] bg-transparent shrink-0 items-center justify-center",
          )}
        >
          <Icon className="size-8" />
        </span>
      ) : null}
      <div className="min-w-0 type-body">
        {title ? <p className="type-h4 text-foreground">{title}</p> : null}
        <div className={cn(title ? "mt-0.5 text-sm" : undefined, config.copy)}>{children}</div>
      </div>
    </div>
  );
}

export { Callout };
