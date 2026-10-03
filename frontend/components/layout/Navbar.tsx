import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { NotificationBell, UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

/**
 * Navbar presentation states.
 *
 * - `guest` — not signed in. Language control only.
 * - `pending` — signed in but still inside the signup journey (email OTP, HCP
 *   credential upload). Language control plus identity, no account menu: there is
 *   no profile to navigate to yet.
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
 * Left: the brand lockup. Right: the state-appropriate controls.
 *
 * On `lg` and up the auth brand panel sits alongside this bar and already carries
 * the lockup, so the mark collapses to free up room for the form.
 */
export function Navbar({ user, variant, className }: NavbarProps) {
  return (
    <header className={cn("border-b border-border/70 bg-background", className)}>
      <div className="mx-auto flex h-14 w-full max-w-8xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <HealthHubLogo className="lg:invisible" />

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {variant === "app" ? <NotificationBell /> : <LanguageControl />}

          {variant === "guest" ? null : user ? (
            <UserMenu user={user} withMenu={variant === "app"} />
          ) : null}
        </div>
      </div>
    </header>
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
