import Link from "next/link";

/**
 * Global navigation bar shared across pages.
 *
 * Left: brand wordmark (leading users home).
 * Right: language selector toggle. For now the toggle is a static,
 * UI-only control — it is not wired to any i18n system yet.
 */
export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          HealthHub
        </Link>
        <button
          type="button"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          English
        </button>
      </div>
    </header>
  );
}
