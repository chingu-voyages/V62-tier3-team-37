import { Settings } from "lucide-react";
import Link from "next/link";
import { HcpAsideNav } from "@/components/features/hcp/HcpAsideNav";
import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HcpAsideLayout() {
  return (
    <TooltipProvider>
      <aside
        aria-label="HCP navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 w-full items-center justify-center bg-background/95 shadow-soft backdrop-blur md:static md:h-dvh md:w-20.5 md:shrink-0 md:flex-col md:justify-between md:bg-background md:py-5 md:shadow-[1px_0_0_0_theme(colors.border/40)] md:backdrop-blur-none"
      >
        <HealthHubLogo withWordmark={false} className="hidden size-11 justify-center md:flex" />

        <div className="flex flex-1 items-center justify-center md:flex-col">
          <HcpAsideNav />
        </div>

        <div className="hidden md:block">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/hcp/settings"
                aria-label="Settings"
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Settings className="size-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
