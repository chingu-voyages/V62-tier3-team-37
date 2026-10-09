import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfileEyebrowProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Small uppercase label for a group of fields inside a section card.
 *
 * The card header is the titled, icon-led row; everything it contains is grouped
 * under one of these, so the card reads as a short ledger rather than one long
 * list. It is an `<h3>` because the card title is the `<h2>`: no section may
 * out-rank the page `<h1>`.
 */
export function ProfileEyebrow({ children, className }: ProfileEyebrowProps) {
  return (
    <h3 className={cn("type-helper font-medium tracking-wide text-primary uppercase", className)}>
      {children}
    </h3>
  );
}
