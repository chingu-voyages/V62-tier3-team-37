"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { resolveEase } from "@/lib/motion/easings";
import { gsap } from "@/lib/motion/gsap";
import { reducedMotionQuery } from "@/lib/motion/resolve";
import type { MotionEase } from "@/lib/motion/types";
import { cn } from "@/lib/utils";

export type SlidingTabItem<T extends string = string> = {
  value: T;
  label: ReactNode;
};

export type SlidingTabsProps<T extends string = string> = {
  items: SlidingTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the tablist. */
  "aria-label": string;
  /** Easing variant (or raw GSAP ease) for the pill's travel. */
  ease?: MotionEase;
  /** Seconds for the pill to travel between tabs. */
  duration?: number;
  /** Prefix for tab/panel ids so panels outside can reference them. */
  idPrefix?: string;
  className?: string;
};

/**
 * Segmented tab control whose active pill slides between options.
 * Pill movement is driven by a GSAP tween on transforms only; colors cross-fade
 * with a plain CSS transition. No motion library involved.
 */
// Last rendered pill position per tablist, so a remounted tab bar (e.g. the
// parent swaps cards on tab change) can slide from where the pill was instead
// of snapping.
const lastPositions = new Map<string, { x: number; width: number }>();

export function SlidingTabs<T extends string = string>({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
  ease = "move",
  duration = 0.25,
  idPrefix,
  className,
}: SlidingTabsProps<T>) {
  const baseId = useId();
  const rootId = idPrefix ?? baseId;
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const valueRef = useRef(value);
  const optionsRef = useRef({ ease, duration });
  const lastTargetRef = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    optionsRef.current = { ease, duration };
  });

  const measureActive = useCallback(() => {
    const list = listRef.current;
    if (!list) return null;
    const active = list.querySelector<HTMLElement>(`[data-value="${valueRef.current}"]`);
    if (!active) return null;
    return { x: active.offsetLeft, width: active.offsetWidth };
  }, []);

  const place = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current;
      const target = measureActive();
      if (!pill || !target) return;
      lastTargetRef.current = target;
      const instant = !animate || window.matchMedia(reducedMotionQuery).matches;
      tweenRef.current?.kill();
      if (instant) {
        tweenRef.current = null;
        gsap.set(pill, { x: target.x, width: target.width, visibility: "visible" });
        return;
      }
      tweenRef.current = gsap.to(pill, {
        x: target.x,
        width: target.width,
        visibility: "visible",
        duration: optionsRef.current.duration,
        ease: resolveEase(optionsRef.current.ease),
        overwrite: "auto",
      });
    },
    [measureActive],
  );

  useEffect(() => {
    let raf = 0;
    const cached = lastPositions.get(rootId);
    if (cached && pillRef.current) {
      // Start where the pill used to be, then slide to the current tab.
      gsap.set(pillRef.current, {
        x: cached.x,
        width: cached.width,
        visibility: "visible",
      });
      raf = requestAnimationFrame(() => place(true));
    } else {
      place(false);
    }
    const list = listRef.current;
    if (!list) return;
    // ResizeObserver reports contentRect (content box) and always fires once on
    // observe; compare like-for-like and ignore the initial report so it never
    // snap-kills the pill's slide.
    let lastWidth: number | null = null;
    let lastHeight: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      if (lastWidth === null) {
        // First report is the entry observation, not a resize.
        lastWidth = rect.width;
        lastHeight = rect.height;
        return;
      }
      if (rect.width === lastWidth && rect.height === lastHeight) return;
      lastWidth = rect.width;
      lastHeight = rect.height;
      place(false);
    });
    observer.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      tweenRef.current?.kill();
      // Remember where the pill was so a remount can slide from here.
      if (lastTargetRef.current) {
        lastPositions.set(rootId, lastTargetRef.current);
      }
    };
  }, [place, rootId]);

  useEffect(() => {
    if (valueRef.current === value) return;
    valueRef.current = value;
    place(true);
  }, [value, place]);

  return (
    <div
      data-motion="sliding-tabs"
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative flex w-full gap-1 rounded-xl bg-muted p-1", className)}
    >
      <div
        ref={pillRef}
        aria-hidden
        className="absolute inset-y-1 left-0 rounded-lg bg-primary shadow-soft"
        style={{ visibility: "hidden" }}
      />
      {items.map((option) => {
        const selected = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            role="tab"
            data-value={option.value}
            id={`${rootId}-tab-${option.value}`}
            aria-selected={selected}
            aria-controls={`${rootId}-panel-${option.value}`}
            tabIndex={selected ? 0 : -1}
            variant="ghost"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 h-10 flex-1 rounded-lg px-3 shadow-none transition-colors",
              selected
                ? "text-primary-foreground hover:bg-transparent hover:text-primary-foreground"
                : "text-primary hover:bg-transparent hover:text-primary",
            )}
            style={{ transitionDuration: `${duration}s` }}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
