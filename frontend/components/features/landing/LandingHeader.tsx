"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import type { AuthUser } from "@/types/auth";

export function LandingHeader({ user }: { user: AuthUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = user !== null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-8xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <HealthHubLogo />

        {signedIn ? (
          <div className="ml-auto">
            <UserMenu user={user} />
          </div>
        ) : (
          <nav aria-label="Account" className="ml-auto hidden items-center gap-1 md:flex">
            <HeaderLinks />
          </nav>
        )}

        {signedIn ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-auto md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </Button>
        )}
      </div>

      {!signedIn && menuOpen ? (
        <nav
          id="landing-menu"
          aria-label="Account"
          className="flex flex-col gap-2 border-t border-border px-4 py-3 md:hidden"
        >
          <HeaderLinks stacked />
        </nav>
      ) : null}
    </header>
  );
}

function HeaderLinks({ stacked = false }: { stacked?: boolean }) {
  return (
    <>
      <Button variant="ghost" asChild className={stacked ? "justify-start" : undefined}>
        <Link href={`${ROUTES.auth}?role=HCP`}>HealthHub for doctors</Link>
      </Button>
      <span className="inline-flex h-9 items-center px-2.5 type-helper font-medium text-muted-foreground">
        English
      </span>
      <Button variant="outline" asChild className={stacked ? "justify-start" : undefined}>
        <Link href={`${ROUTES.auth}?tab=login`}>Log in</Link>
      </Button>
      <Button asChild className={stacked ? "justify-start" : undefined}>
        <Link href={ROUTES.auth}>Sign up</Link>
      </Button>
    </>
  );
}
