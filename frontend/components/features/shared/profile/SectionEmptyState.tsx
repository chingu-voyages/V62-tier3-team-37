import { cn } from "@/lib/utils";

type SectionEmptyStateProps = {
  message: string;
  className?: string;
};

/** Restrained "loaded, but nothing here" message used inside a section. */
export function SectionEmptyState({ message, className }: SectionEmptyStateProps) {
  return <p className={cn("type-body text-muted-foreground", className)}>{message}</p>;
}
