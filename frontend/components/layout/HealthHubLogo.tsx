import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HealthHubLogoProps = {
  className?: string;
  /**
   * `light` is for the dark brand panel, `dark` is for light surfaces.
   */
  tone?: "light" | "dark";
  /** Renders the wordmark next to the mark. */
  withWordmark?: boolean;
};

/**
 * HealthHub brand lockup: the mark plus an optional wordmark.
 *
 * The mark is the HealthHub monogram. Sora carries the wordmark so it reads
 * as a heading rather than body copy.
 */
export function HealthHubLogo({
  className,
  tone = "dark",
  withWordmark = true,
}: HealthHubLogoProps) {
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      aria-label="HealthHub home"
      className={cn("inline-flex shrink-0 items-center gap-2.5 ", className)}
    >
      {isLight ? (
        <Image
          src="/logo-mark-on-dark.svg"
          alt=""
          width={1024}
          height={759}
          className="h-12 w-auto"
        />
      ) : (
        <Image
          src="/logo-mark-on-light.svg"
          alt=""
          width={1024}
          height={759}
          className="h-12 w-auto"
        />
      )}
      {withWordmark ? (
        <span
          className={cn(
            "font-heading type-h3 tracking-[-0.01em]",
            isLight ? "text-primary-foreground" : "text-primary",
          )}
        >
          HealthHub
        </span>
      ) : null}
    </Link>
  );
}
