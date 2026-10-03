import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = [
  { href: ROUTES.privacy, label: "Privacy Policy" },
  { href: ROUTES.terms, label: "Terms of Service" },
  { href: ROUTES.support, label: "Support" },
] as const;

/**
 * Compact site footer.
 *
 * Deliberately small: it is designed to sit at the bottom of the fixed-height
 * auth column, so it must never compete with the form for vertical space.
 * Copyright line stacks above the navigation links on small screens.
 *
 * Paths come from `ROUTES` so they cannot drift from the ones the signup form
 * links to — the two previously pointed at different URLs for the same two pages.
 *
 * Not currently mounted by any route; the auth layout reserves the space for it.
 */
export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border/70 bg-background", className)}>
      <div className="mx-auto flex w-full max-w-[100rem] flex-col items-center justify-between gap-2 px-4 py-4 text-center sm:px-6 sm:text-left lg:px-8 xl:px-10 2xl:px-14">
        <p className="type-helper text-muted-foreground">© 2026 HealthHub. All rights reserved.</p>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:justify-end"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm type-helper text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
