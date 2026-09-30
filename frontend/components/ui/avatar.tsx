"use client";

import { User } from "lucide-react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: AvatarPrimitive.AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.AvatarImageProps) {
  return <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} {...props} />;
}

function AvatarFallback({ className, children, ...props }: AvatarPrimitive.AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <User className="size-5" />}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
