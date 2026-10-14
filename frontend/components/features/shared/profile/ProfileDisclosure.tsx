"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileDisclosureProps = {
  /** Always visible: the primary facts of the section. */
  summary: ReactNode;
  /** Secondary facts, revealed on request. */
  children: ReactNode;
  label?: string;
  expandedLabel?: string;
  className?: string;
};

/**
 * Progressive disclosure for a section that has more to say than a card should
 * show at once.
 *
 * The card keeps its primary facts on screen and offers the rest behind a
 * labelled control, so a long profile stays scannable without hiding anything
 * the provider cannot find. The control carries `aria-expanded` / `aria-controls`
 * and the revealed region uses the `hidden` attribute, so collapsed content is
 * neither announced nor focusable.
 */
export function ProfileDisclosure({
  summary,
  children,
  label = "See more",
  expandedLabel = "Show less",
  className,
}: ProfileDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleToggle() {
    // Collapsing hides the region, so anything focused inside it would be
    // dropped onto <body> and lose the reader's place in the page. Return focus
    // to the control that hid it instead.
    if (expanded) {
      const active = document.activeElement;
      if (contentRef.current?.contains(active)) triggerRef.current?.focus();
      setExpanded(false);
      return;
    }

    setExpanded(true);
  }

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {summary}

      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={handleToggle}
        >
          {expanded ? expandedLabel : label}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
      </div>

      {/* No display utility on this wrapper: the `hidden` attribute must be able to
          hide it. */}
      <div ref={contentRef} id={contentId} hidden={!expanded} className="mt-5">
        {children}
      </div>
    </div>
  );
}
