import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type FieldMessageProps = {
  id?: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Inline validation message for a form control.
 *
 * `aria-live="polite"` announces the message when it appears, but the primary
 * mechanism is the `aria-describedby` wiring in `FormField` — a screen reader
 * should read the error when focus enters the control, not interrupt whatever the
 * user is currently hearing.
 */
export function FieldMessage({ id, children, className }: FieldMessageProps) {
  const message = typeof children === "string" ? children : undefined;
  if (!message) return null;

  return (
    <p
      id={id}
      aria-live="polite"
      className={cn("flex items-start gap-1.5 type-helper text-destructive", className)}
    >
      <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
