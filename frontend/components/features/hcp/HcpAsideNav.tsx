"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { hcpNavigation } from "./hcp-navigation";

export function HcpAsideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="HCP navigation" className="flex flex-row items-center gap-3 md:flex-col">
      {hcpNavigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                aria-label={item.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-primary",
                )}
              >
                <item.icon className="size-5 rotate-0 md:rotate-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              {item.label}
            </TooltipContent>
            <TooltipContent side="top" className="md:hidden">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
