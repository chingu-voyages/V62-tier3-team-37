"use client";

import {
  Calendar,
  CalendarDays,
  ClipboardList,
  type LucideIcon,
  MessageSquare,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavIconKey, NavItem } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  search: Search,
  calendar: Calendar,
  calendarDays: CalendarDays,
  clipboard: ClipboardList,
  message: MessageSquare,
  sparkles: Sparkles,
  user: UserRound,
  users: UsersRound,
};

type AsideNavProps = {
  items: NavItem[];
  /** Accessible name for the `<nav>` landmark, e.g. "Patient navigation". */
  label: string;
};

/**
 * The icon rail used by both areas.
 *
 * `PatientAsideNav` and `HcpAsideNav` were 41 of 44 lines identical, differing
 * only in the imported array and the label string.
 */
export function AsideNav({ items, label }: AsideNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-row items-center gap-3 md:flex-col">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.icon];

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                aria-label={item.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            </TooltipTrigger>
            {/* One tooltip per breakpoint: the rail is a side bar on md+, a bottom
                bar below it, so the label has to open in a different direction. */}
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
