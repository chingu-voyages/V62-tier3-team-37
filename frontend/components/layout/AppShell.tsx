import type { ReactNode } from "react";
import { AppAsideLayout } from "@/components/layout/AppAsideLayout";
import { Navbar } from "@/components/layout/Navbar";
import type { NavItem } from "@/lib/constants/routes";
import { getOptionalUser } from "@/lib/dal/auth";
import { cn } from "@/lib/utils";

type AppShellProps = {
  items: NavItem[];
  /** Accessible name for the side rail, e.g. "Patient navigation". */
  label: string;
  settingsHref?: string;
  /** Rendered outside the scroll container, e.g. a docked assistant. */
  aside?: ReactNode;
  /**
   * Patient chrome: muted page (same surface as the public home) and a floating
   * white tab rail with a single logo in the navbar.
   */
  floatingNav?: boolean;
  /**
   * Vertically centre short pages. Off by default: it made short routes float in
   * the middle of the viewport while long ones overflowed, and the HCP area had
   * no equivalent, so the two areas rendered differently.
   */
  centerContent?: boolean;
  children: ReactNode;
};

/**
 * The authenticated app chrome: navbar, side rail, scrolling main column, and an
 * optional docked overlay.
 *
 * `app/patient/layout.tsx` and `app/hcp/layout.tsx` were near-duplicates, and the
 * HCP layout reached into `@/layouts/Patient` for a generic `<main>` wrapper.
 * Both now describe only what differs: the nav items and the label.
 */
export async function AppShell({
  items,
  label,
  settingsHref,
  aside,
  centerContent,
  floatingNav = false,
  children,
}: AppShellProps) {
  const user = await getOptionalUser();

  return (
    <div className={cn("flex min-h-dvh", floatingNav && "bg-muted")}>
      <AppAsideLayout
        items={items}
        label={label}
        settingsHref={settingsHref}
        floating={floatingNav}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} variant="app" className="sticky top-0 z-30 shrink-0" />

        <main
          className={cn(
            "flex flex-1 flex-col",
            floatingNav ? "bg-muted md:pl-24" : "bg-background",
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-8xl flex-1 flex-col px-6 py-8 pb-24 md:pb-8 lg:px-8 xl:px-20",
              centerContent && "justify-center",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {aside}
    </div>
  );
}
