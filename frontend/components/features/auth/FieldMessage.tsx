import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldMessageProps = {
  id?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Inline field error.
 *
 * Single visual treatment for every validation message in the auth forms:
 * small destructive text with a matching icon, linked to its input through the
 * `id` passed by the caller (`aria-describedby`).
 */
export function FieldMessage({ id, children, className }: FieldMessageProps) {
  if (!children) return null;

  return (
    <p id={id} className={cn("flex items-start gap-1.5 type-helper text-destructive", className)}>
      <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
