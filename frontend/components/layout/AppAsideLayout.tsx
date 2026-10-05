import { Settings } from "lucide-react";
import Link from "next/link";
import { AsideNav } from "@/components/layout/AsideNav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavItem } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

type AppAsideLayoutProps = {
  items: NavItem[];
  /** Accessible name for the `<aside>` landmark. */
  label: string;
  /** Omit when the area has no settings screen yet. */
  settingsHref?: string;
  /**
   * Patient rail: no second logo, and the tabs sit in a white pill over the page
   * instead of a full-height bar.
   */
  floating?: boolean;
};

/**
 * The responsive side rail shared by the patient and HCP areas.
 *
 * `PatientAsideLayout` and `HcpAsideLayout` were 32 of 37 lines identical — the
 * entire 137-character layout class string was duplicated verbatim, along with the
 * whole tooltip block. Only the nav array, the label and the settings href differ.
 *
 * Server Component: it renders no interactivity of its own beyond passing arrays
 * down to the client `AsideNav`.
 */
export function AppAsideLayout({
  items,
  label,
  settingsHref,
  floating = false,
}: AppAsideLayoutProps) {
  return (
    <TooltipProvider>
      <aside
        aria-label={label}
        className={cn(
          floating
            ? "pointer-events-none fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 justify-center md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2 md:translate-x-0"
            : "fixed inset-x-0 bottom-0 z-40 flex h-16 w-full items-center justify-center bg-background/95 shadow-soft backdrop-blur md:static md:h-dvh md:w-20.5 md:shrink-0 md:flex-col md:justify-between md:bg-background md:py-5 md:shadow-[1px_0_0_0_theme(colors.border/40)] md:backdrop-blur-none",
        )}
      >
        {/* {floating ? null : (
          <HealthHubLogo withWordmark={false} className="hidden size-11 justify-center md:flex" />
        )} */}

        <div
          className={cn(
            floating
              ? "pointer-events-auto flex items-center gap-1 rounded-full bg-white p-1.5 shadow-panel ring-1 ring-border/70 md:flex-col"
              : "flex flex-1 items-center justify-center md:flex-col",
          )}
        >
          <AsideNav items={items} label={label} />
          {floating ? <SettingsLink href={settingsHref} /> : null}
        </div>

        {floating ? null : <SettingsLink href={settingsHref} className="hidden md:block" />}
      </aside>
    </TooltipProvider>
  );
}

function SettingsLink({ href, className }: { href?: string; className?: string }) {
  if (!href) return null;

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Settings className="size-5" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>
    </div>
  );
}
