import { cn } from "cn";
import type * as React from "react";

/**
 * Single form control height for the whole product (44px) so fields never
 * drift apart visually. Padding is derived from the height rather than
 * stacked on top of it.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3.5 type-body text-foreground transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:type-helper file:font-medium file:text-foreground placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15 dark:bg-input/20 dark:disabled:bg-input/10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
