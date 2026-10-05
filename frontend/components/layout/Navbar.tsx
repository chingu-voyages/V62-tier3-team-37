import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { NotificationBell, UserMenu } from "@/components/layout/UserMenu";
import { GsapTimeline } from "@/components/motion";
import { ROUTES } from "@/lib/constants/routes";
import type { MotionStep } from "@/lib/motion";
import type { AuthUser } from "@/types/auth";

/**
 * Navbar presentation states.
 *
 * - `guest` — not signed in. Back to the landing page, then the language control.
 * - `pending` — signed in but still inside the signup journey (email OTP, HCP
 *   credential upload). Same header controls plus identity, no account menu:
 *   there is no profile to navigate to yet.
 * - `app` — signed in and inside their own area. Language control is dropped and
 *   replaced by notifications plus the account menu.
 *
 * The variant is decided by whichever shell renders the navbar rather than by
 * inspecting the pathname, so it cannot drift out of sync with the route guards.
 */
export type NavbarVariant = "guest" | "pending" | "app";

type NavbarProps = {
  user: AuthUser;
  variant: NavbarVariant;
  className?: string;
};

/**
 * Global navigation bar.
 *
 * Left: back to the landing page on auth screens, then the brand lockup.
 * Right: the state-appropriate controls. English stays on this side.
 *
 * On `lg` and up the auth brand panel sits alongside this bar and already carries
 * the lockup, so the mark collapses to free up room for the form.
 */
const navbarSteps: MotionStep[] = [
  {
    target: "navbar",
    label: "navbar",
    direction: "none",
    scaleY: 0,
    duration: 0.6,
    ease: "back.out(1.7)",
    transformOrigin: "top center",
  },
  {
    target: "navbar-back",
    position: "navbar+=0.12",
    direction: "left",
    distance: { mobile: 14, tablet: 20, desktop: 28 },
    duration: 0.5,
    ease: "entrance",
  },
  {
    target: "navbar-brand",
    position: "navbar+=0.18",
    direction: "left",
    distance: { mobile: 14, tablet: 20, desktop: 28 },
    duration: 0.5,
    ease: "entrance",
  },
  {
    target: "navbar-status",
    position: "navbar+=0.24",
    direction: "right",
    distance: { mobile: 14, tablet: 20, desktop: 28 },
    duration: 0.5,
    ease: "entrance",
  },
  {
    target: "navbar-user",
    position: "navbar+=0.32",
    direction: "right",
    distance: { mobile: 14, tablet: 20, desktop: 28 },
    duration: 0.5,
    ease: "entrance",
  },
];

export function Navbar({ user, variant, className }: NavbarProps) {
  return (
    <GsapTimeline steps={navbarSteps} className={className}>
      <header data-motion="navbar" className="border-b border-border/70 bg-background">
        <div className="mx-auto flex h-14 w-full max-w-8xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
          <div className="flex min-w-0 items-center gap-2">
            {variant === "app" ? null : <BackToLanding />}
            <span data-motion="navbar-brand" className="inline-flex">
              <HealthHubLogo className={variant === "app" ? undefined : "lg:hidden"} />
            </span>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span data-motion="navbar-status" className="inline-flex">
              {variant === "app" ? <NotificationBell /> : <LanguageControl />}
            </span>

            {variant === "guest" ? null : user ? (
              <span data-motion="navbar-user" className="inline-flex">
                <UserMenu user={user} withMenu={variant === "app"} />
              </span>
            ) : null}
          </div>
        </div>
      </header>
    </GsapTimeline>
  );
}

function BackToLanding() {
  return (
    <Link
      href={ROUTES.home}
      data-motion="navbar-back"
      aria-label="Back to the landing page"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 type-helper font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back
    </Link>
  );
}

/**
 * Language control. UI only — no i18n runtime is wired up yet, so it is a
 * disabled control rather than a live-looking button that does nothing.
 */
function LanguageControl() {
  return (
    <button
      type="button"
      disabled
      aria-label="Language: English"
      title="Language selection is coming soon"
      className="inline-flex h-9 shrink-0 items-center rounded-md px-2.5 type-helper font-medium text-muted-foreground opacity-60"
    >
      English
    </button>
  );
}
