import Link from "next/link";

/**
 * Global footer shown on every page.
 *
 * Copyright line on small screens stacks above the navigation links.
 */
export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-muted-foreground">© 2026 Healthconnect. All rights reserved.</p>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <Link
            href="/privacy-policy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
