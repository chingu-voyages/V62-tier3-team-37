"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 100,
  ...props
}: TooltipPrimitive.TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 type-helper text-primary-foreground shadow-soft animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-0.5 data-[side=left]:slide-in-from-right-0.5 data-[side=right]:slide-in-from-left-0.5 data-[side=top]:slide-in-from-bottom-0.5",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
