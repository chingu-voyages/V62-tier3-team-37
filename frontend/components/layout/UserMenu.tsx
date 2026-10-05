"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/hooks/use-auth-mutations";
import { userDisplayName, userInitials, userProfileHref } from "@/lib/auth/display";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type UserMenuProps = {
  user: AuthUser;
  /** `true` on the role pages, where the menu is the primary navigation. */
  withMenu?: boolean;
};

/**
 * Signed-in identity block: avatar, name over email, and an account menu.
 *
 * The trigger is a button so the menu is announced correctly and opens on
 * keyboard as well as click. Focus returns to the trigger when the menu closes.
 */
export function UserMenu({ user, withMenu = true }: UserMenuProps) {
  const displayName = userDisplayName(user);
  const initials = userInitials(user);
  const email = user?.email ?? "";
  const photo = user?.profile_photo_path;

  const identity = (
    <>
      <Avatar className="size-9 shrink-0">
        {photo ? <AvatarImage src={photo} alt="" /> : null}
        <AvatarFallback className="bg-accent type-helper font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <span className="flex min-w-0 flex-col text-left leading-tight">
        <span className="truncate type-label font-medium text-foreground">{displayName}</span>
        {email ? <span className="truncate type-helper text-muted-foreground">{email}</span> : null}
      </span>
    </>
  );

  if (!withMenu) {
    return <div className="flex min-w-0 items-center gap-2.5">{identity}</div>;
  }

  return (
    <AccountMenu
      displayName={displayName}
      initials={initials}
      email={email}
      photo={photo}
      profileHref={userProfileHref(user)}
    />
  );
}

type AccountMenuProps = {
  displayName: string;
  initials: string;
  email: string;
  photo: string | null | undefined;
  profileHref: string;
};

function AccountMenu({ displayName, initials, email, photo, profileHref }: AccountMenuProps) {
  const logoutMutation = useLogoutMutation();
  const router = useRouter();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        router.push(ROUTES.home);
        router.refresh();
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-2xl border-0 outline-0 py-1 pl-1 pr-2 transition-colors",
            "hover:bg-accent/80",
            "data-[state=open]:bg-accent/70",
          )}
          aria-label={`Account menu for ${displayName}`}
        >
          <Avatar className="size-9 shrink-0">
            {photo ? <AvatarImage src={photo} alt="" /> : null}
            <AvatarFallback className="bg-accent type-helper font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="hidden min-w-0 truncate type-label font-medium text-foreground sm:inline">
            {displayName}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="truncate type-label font-medium text-foreground">{displayName}</span>
          {email ? <span className="truncate">{email}</span> : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
          disabled={logoutMutation.isPending}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {logoutMutation.isPending ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NotificationBell() {
  return (
    <button
      type="button"
      disabled
      aria-label="Notifications (coming soon)"
      title="Notifications — coming soon"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </button>
  );
}
