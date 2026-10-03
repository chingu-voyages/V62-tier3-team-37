import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfilePillProps = {
  children: ReactNode;
  tone?: "accent" | "neutral";
  className?: string;
};

export function ProfilePill({ children, tone = "neutral", className }: ProfilePillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-lg border px-2.5 py-1 type-helper",
        tone === "accent"
          ? "border-secondary/30 bg-accent text-primary"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
