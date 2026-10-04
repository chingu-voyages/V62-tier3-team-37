"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { resolveEase } from "@/lib/motion/easings";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { reducedMotionQuery } from "@/lib/motion/resolve";
import type { MotionEase } from "@/lib/motion/types";

/** Which dimension(s) the wrapper animates. Height is the polished default. */
export type AnimatedSizeAxis = "height" | "width" | "both";

export type AnimatedSizeProps = {
  children: ReactNode;
  /** Dimension(s) to animate. Defaults to "height". */
  axis?: AnimatedSizeAxis;
  /** Animate to zero when true, back to the natural content size when false. */
  collapsed?: boolean;
  /** Seconds, or "auto" for a deterministic distance-based duration. */
  duration?: number | "auto";
  /** Easing variant (or raw GSAP ease). Defaults to the "layout" variant. */
  ease?: MotionEase;
  /** Seconds before the transition starts. */
  delay?: number;
  /** Skip animation and settle instantly, like reduced motion. */
  disabled?: boolean;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

type Size = { width: number; height: number };

const AUTO_DURATION_BASE = 0.35;
const AUTO_DURATION_RANGE = 0.25;
const AUTO_DURATION_DISTANCE = 800;
const SETTLED_EPSILON = 1;

/** Larger size changes take slightly longer, within a deterministic range. */
function resolveDuration(duration: number | "auto", distance: number): number {
  if (duration !== "auto") return duration;
  const clamped = Math.min(Math.max(distance, 0), AUTO_DURATION_DISTANCE);
  const progress = clamped / AUTO_DURATION_DISTANCE;
  return Math.round((AUTO_DURATION_BASE + progress * AUTO_DURATION_RANGE) * 1000) / 1000;
}

function readEntrySize(entry: ResizeObserverEntry): Size {
  const box = entry.borderBoxSize?.[0];
  if (box) return { width: box.inlineSize, height: box.blockSize };
  return { width: entry.contentRect.width, height: entry.contentRect.height };
}

/**
 * Smoothly animates its own box when the natural size of its content changes.
 *
 * The wrapper owns nothing but dimensions: children keep their normal layout,
 * typography and styling, and the wrapper returns to a natural `auto` size
 * when a transition finishes. Content changes are detected with a
 * ResizeObserver, so conditional rendering, validation messages, async
 * content and responsive wrapping are all handled without the consumer
 * reporting anything.
 *
 * Motion is enhancement only. Under reduced motion, when `disabled`, or when
 * JS never runs, the layout simply settles into its natural or collapsed
 * state with content fully visible.
 */
export function AnimatedSize({
  children,
  axis = "height",
  collapsed = false,
  duration = "auto",
  ease = "layout",
  delay = 0,
  disabled = false,
  className,
  onStart,
  onComplete,
}: AnimatedSizeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<((animate: boolean) => void) | null>(null);
  const collapsedRef = useRef(collapsed);
  const previousCollapsedRef = useRef(collapsed);
  const callbacksRef = useRef({ onStart, onComplete });
  const optionsRef = useRef({ axis, duration, ease, delay, disabled });

  // Keep the mount-time GSAP setup reading the latest options/callbacks.
  useEffect(() => {
    callbacksRef.current = { onStart, onComplete };
    optionsRef.current = { axis, duration, ease, delay, disabled };
  });

  useEffect(() => {
    collapsedRef.current = collapsed;
    if (previousCollapsedRef.current === collapsed) return;
    previousCollapsedRef.current = collapsed;
    transitionRef.current?.(true);
  }, [collapsed]);

  useGSAP(
    (_context, contextSafe) => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      let lastSize: Size = { width: inner.offsetWidth, height: inner.offsetHeight };
      let tween: gsap.core.Tween | null = null;
      let pendingResize = false;

      const usesHeight = () => optionsRef.current.axis !== "width";
      const usesWidth = () => optionsRef.current.axis !== "height";
      const shouldAnimate = () =>
        !optionsRef.current.disabled && !window.matchMedia(reducedMotionQuery).matches;
      const measureOuter = (): Size => ({ width: outer.offsetWidth, height: outer.offsetHeight });

      function setInteractive(interactive: boolean) {
        if (interactive) {
          gsap.set(inner, { clearProps: "visibility,pointerEvents" });
        } else {
          gsap.set(inner, { visibility: "hidden", pointerEvents: "none" });
        }
      }

      function settleCollapsed() {
        const vars: gsap.TweenVars = { overflow: "hidden" };
        if (usesHeight()) vars.height = 0;
        if (usesWidth()) vars.width = 0;
        gsap.set(outer, vars);
        setInteractive(false);
      }

      function settleNatural() {
        gsap.set(outer, { clearProps: "height,width,overflow" });
        setInteractive(true);
      }

      function settle() {
        tween = null;
        if (collapsedRef.current) {
          settleCollapsed();
        } else {
          settleNatural();
          // Content changed while the previous transition was running.
          if (pendingResize) {
            pendingResize = false;
            safeTransition(true);
          }
        }
        callbacksRef.current.onComplete?.();
      }

      function transition(animate: boolean, from?: Size) {
        const target: Size = collapsedRef.current ? { width: 0, height: 0 } : lastSize;
        const start = from ?? measureOuter();
        const distance = Math.max(
          usesHeight() ? Math.abs(start.height - target.height) : 0,
          usesWidth() ? Math.abs(start.width - target.width) : 0,
        );

        if (!animate || !shouldAnimate() || distance < SETTLED_EPSILON) {
          tween?.kill();
          tween = null;
          pendingResize = false;
          if (collapsedRef.current) settleCollapsed();
          else settleNatural();
          return;
        }

        // Interactive again as soon as an expand starts, hidden only after a
        // collapse settles.
        if (!collapsedRef.current) setInteractive(true);

        const fromVars: gsap.TweenVars = { overflow: "hidden" };
        const toVars: gsap.TweenVars = {
          duration: resolveDuration(optionsRef.current.duration, distance),
          delay: optionsRef.current.delay,
          ease: resolveEase(optionsRef.current.ease),
          overwrite: "auto",
          onStart: () => callbacksRef.current.onStart?.(),
          onComplete: () => safeSettle(),
        };
        if (usesHeight()) {
          fromVars.height = start.height;
          toVars.height = target.height;
        }
        if (usesWidth()) {
          fromVars.width = start.width;
          toVars.width = target.width;
        }

        tween?.kill();
        tween = gsap.fromTo(outer, fromVars, toVars);
      }

      const safeTransition = contextSafe ? contextSafe(transition) : transition;
      const safeSettle = contextSafe ? contextSafe(settle) : settle;

      transitionRef.current = (animate) => safeTransition(animate);

      if (collapsedRef.current) settleCollapsed();

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // The wrapper may be inside a hidden subtree; ignore those reports.
          if (entry.target !== inner || inner.getClientRects().length === 0) continue;

          const next = readEntrySize(entry);
          if (next.width === lastSize.width && next.height === lastSize.height) continue;

          const previous = lastSize;
          lastSize = next;

          if (collapsedRef.current || !shouldAnimate()) continue;

          if (tween?.isActive()) {
            // Latest content wins; settle() runs a follow-up if needed.
            pendingResize = true;
            continue;
          }

          safeTransition(true, previous);
        }
      });
      observer.observe(inner);

      return () => {
        observer.disconnect();
        tween = null;
        transitionRef.current = null;
      };
    },
    { scope: outerRef, dependencies: [] },
  );

  return (
    <div ref={outerRef} className={className}>
      {/* flow-root keeps margins inside, so measurement sees the real content box. */}
      <div ref={innerRef} className="flow-root">
        {children}
      </div>
    </div>
  );
}
