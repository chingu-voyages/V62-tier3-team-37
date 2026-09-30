import { cn } from "@/lib/utils";
import { HealthHubLogo } from "./HealthHubLogo";

/**
 * Global navigation bar.
 *
 * Left: the HealthHub brand lockup. Right: the language selector. The toggle
 * is a static, UI-only control — it is not wired to any i18n system yet.
 *
 * On `lg` and up the brand panel sits alongside this bar and already carries
 * the lockup, so the mark collapses to free up room for the form.
 */
export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("border-b border-border/70 bg-background", className)}>
      <div className="mx-auto flex h-14 w-full max-w-[100rem] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <HealthHubLogo className="lg:invisible" />

        <button
          type="button"
          className={cn(
            "ml-auto inline-flex h-9 shrink-0 items-center rounded-md px-2.5 type-helper font-medium text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          English
        </button>
      </div>
    </header>
  );
}
