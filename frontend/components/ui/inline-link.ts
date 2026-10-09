import { cn } from "@/lib/utils";

/**
 * Inline text-link styling.
 *
 * Previously declared three times as a local `LINK_CLASS` constant and inlined
 * twice more — one of the inline copies had already lost its `focus-visible`
 * ring, so focus styling required five edits to keep consistent.
 */
export const inlineLinkClassName = cn(
  "rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 z-50 pointer-events-auto",
  "transition-colors hover:text-primary/85 hover:decoration-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
);
