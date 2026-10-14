"use client";

import type gsap from "gsap";
import { type ReactNode, type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { useMediaReady } from "@/components/motion/useMediaReady";
import { resolveEase } from "@/lib/motion/easings";
import { type GsapCore, loadGsap, scheduleMotion } from "@/lib/motion/gsap";
import { motionDefaults } from "@/lib/motion/presets";
import {
  directionToTweenVars,
  motionMediaQueries,
  resolveBreakpoint,
  resolveMotionTargets,
  resolveResponsiveValue,
} from "@/lib/motion/resolve";
import type { MotionBreakpoint, MotionStepDefaults, MotionSteps } from "@/lib/motion/types";

/** Wraps a function so animations it creates belong to the component context. */
export type ContextSafe = <T extends (...args: never[]) => unknown>(func: T) => T;

/** Imperative controls for pages that choreograph beyond the initial entrance. */
export type GsapTimelineHandle = {
  play: () => void;
  pause: () => void;
  resume: () => void;
  reverse: () => void;
  restart: () => void;
  seek: (position: gsap.Position, suppressEvents?: boolean) => void;
  progress: (value?: number) => number;
  kill: () => void;
  revert: () => void;
  getTimeline: () => gsap.core.Timeline | null;
  contextSafe: ContextSafe | null;
};

export type GsapTimelineProps = {
  /** Any content containing `data-motion="..."` targets. */
  children: ReactNode;
  /** Static steps, or a factory resolved for the matching breakpoint. */
  steps: MotionSteps;
  /** Overrides merged over the default entrance preset. */
  defaults?: Partial<MotionStepDefaults>;
  /**
   * Named markers added after the steps, so they can reference step labels,
   * e.g. `{ finish: "card+=0.55" }`. Step positions may only reference labels
   * declared by earlier steps.
   */
  labels?: Record<string, gsap.Position>;
  /** Build the timeline paused so a parent can control it. Defaults to autoplay. */
  paused?: boolean;
  /**
   * Hold the timeline at its start state until every `[data-motion-media]`
   * image in scope can paint, then play. The `from` state is applied right
   * away, so nothing flashes while the image is still loading.
   */
  waitForMedia?: boolean;
  onComplete?: () => void;
  className?: string;
  ref?: Ref<GsapTimelineHandle>;
};

function buildTimeline(
  engine: GsapCore,
  root: HTMLElement,
  steps: MotionSteps,
  defaults: MotionStepDefaults,
  labels: Record<string, gsap.Position> | undefined,
  breakpoint: MotionBreakpoint,
  onComplete: (() => void) | undefined,
): gsap.core.Timeline {
  const timeline = engine.timeline({ onComplete });
  const resolvedSteps = typeof steps === "function" ? steps({ breakpoint }) : steps;

  for (const step of resolvedSteps) {
    if (step.disabled) continue;

    const targets = resolveMotionTargets(root, step.target);
    if (targets.length === 0) continue;

    const direction = step.direction ?? defaults.direction;
    const distance = resolveResponsiveValue(
      step.distance,
      resolveResponsiveValue(defaults.distance, 24, breakpoint),
      breakpoint,
    );
    const opacity = step.opacity ?? defaults.opacity;
    const autoAlpha = step.autoAlpha;
    const scale = step.scale ?? defaults.scale;
    const scaleX = step.scaleX ?? 1;
    const scaleY = step.scaleY ?? 1;
    const duration = step.duration ?? defaults.duration;
    const delay = step.delay ?? defaults.delay;
    const stagger = step.stagger ?? defaults.stagger;

    // Explicit position wins; `overlap` is sugar for starting before the
    // previous step ends; otherwise the step chains at the timeline's end.
    const position =
      step.position ?? (step.overlap !== undefined ? `">-=${step.overlap}"` : undefined);

    if (step.label) timeline.addLabel(step.label, position);

    const fromVars: gsap.TweenVars = {
      ...directionToTweenVars(direction, distance),
      duration,
      ease: resolveEase(step.ease ?? defaults.ease),
      clearProps: defaults.clearProps,
    };

    // autoAlpha (decorative) wins over plain opacity (interactive content).
    if (autoAlpha !== undefined) {
      if (autoAlpha !== 1) fromVars.autoAlpha = autoAlpha;
    } else if (opacity !== 1) {
      fromVars.opacity = opacity;
    }
    if (scale !== 1) fromVars.scale = scale;
    if (scaleX !== 1) fromVars.scaleX = scaleX;
    if (scaleY !== 1) fromVars.scaleY = scaleY;
    if (step.transformOrigin) fromVars.transformOrigin = step.transformOrigin;
    if (delay !== 0) fromVars.delay = delay;
    if (stagger !== 0) fromVars.stagger = stagger;

    timeline.from(targets, { ...fromVars, ...step.vars }, position);
  }

  // Added after the steps so static markers can reference step labels.
  if (labels) {
    for (const [name, position] of Object.entries(labels)) {
      timeline.addLabel(name, position);
    }
  }

  return timeline;
}

/**
 * Renders its children untouched and animates every `data-motion` target
 * inside with one scoped GSAP timeline.
 *
 * Motion is enhancement only: the markup renders in its final state without
 * JS, and reduced-motion visitors never have animation state applied at all.
 */
export function GsapTimeline({
  children,
  steps,
  defaults,
  labels,
  paused = false,
  waitForMedia = false,
  onComplete,
  className,
  ref,
}: GsapTimelineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const mediaReady = useMediaReady(rootRef, waitForMedia);
  const mediaReadyRef = useRef(mediaReady);
  const contextSafeRef = useRef<ContextSafe | null>(null);

  /**
   * Build the timeline off the hydration commit.
   *
   * This used to be `useGSAP`, which runs in a layout effect — synchronously,
   * inside React's commit, before the browser gets to paint. Every timeline on
   * the page therefore ran its `matchMedia` setup and `from()` measurement in
   * one long task on the critical path, which is exactly what TBT charges for:
   * the auth audit put a 52ms task in GSAP's CSSPlugin and 104ms unattributed.
   *
   * Now the engine is fetched on demand and the setup is queued through
   * `scheduleMotion`, so it lands in the frame *after* hydration paints. The
   * entrance looks the same — the pre-paint frame in globals.css holds the
   * elements at their from-state until the engine applies its own — but it no
   * longer competes with hydration for the main thread.
   */
  useEffect(() => {
    let disposed = false;
    let cancelScheduled: () => void = () => {};

    void loadGsap().then((engine: GsapCore) => {
      if (disposed) return;

      cancelScheduled = scheduleMotion(() => {
        if (disposed) return;

        // The pre-paint frozen frame in globals.css has done its job once the
        // engine is about to apply its own from-states. Removing it first keeps
        // `from()` reading the natural values instead of the frozen ones.
        document.documentElement.classList.remove("motion-enabled");

        const root = rootRef.current;
        if (!root) return;

        const resolvedDefaults: MotionStepDefaults = { ...motionDefaults, ...defaults };
        const context = engine.context(() => {
          const media = engine.matchMedia();

          media.add(motionMediaQueries, (matchContext) => {
            const breakpoint = resolveBreakpoint(matchContext.conditions);
            const timeline = buildTimeline(
              engine,
              root,
              steps,
              resolvedDefaults,
              labels,
              breakpoint,
              onComplete,
            );

            timelineRef.current = timeline;
            if (paused || (waitForMedia && !mediaReadyRef.current)) timeline.pause();
          });
        }, root);

        // `context.add(func)` is the single-argument form: it runs `func`
        // inside the context and records whatever animations it creates so they
        // are reverted together. This is the `contextSafe` helper `@gsap/react`
        // used to hand back, reimplemented so the engine can stay lazy.
        contextSafeRef.current = ((func: never) =>
          context.add(func as unknown as () => void)) as ContextSafe;
      });
    });

    return () => {
      disposed = true;
      cancelScheduled();
      timelineRef.current?.revert();
      timelineRef.current = null;
      contextSafeRef.current = null;
    };
    // Mount-only: the engine is memoised and the steps are read at build time.
    // This matches the `dependencies: []` that the useGSAP call used.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, labels, waitForMedia, paused, onComplete, defaults]);

  useEffect(() => {
    mediaReadyRef.current = mediaReady;
    if (!paused && waitForMedia && mediaReady) timelineRef.current?.play();
  }, [paused, waitForMedia, mediaReady]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        timelineRef.current?.play();
      },
      pause: () => {
        timelineRef.current?.pause();
      },
      resume: () => {
        timelineRef.current?.resume();
      },
      reverse: () => {
        timelineRef.current?.reverse();
      },
      restart: () => {
        timelineRef.current?.restart();
      },
      seek: (position, suppressEvents) => {
        timelineRef.current?.seek(position, suppressEvents);
      },
      progress: (value) => {
        const timeline = timelineRef.current;
        if (!timeline) return 0;
        if (value === undefined) return timeline.progress();
        timeline.progress(value);
        return timeline.progress();
      },
      kill: () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
      },
      revert: () => {
        timelineRef.current?.revert();
        timelineRef.current = null;
      },
      getTimeline: () => timelineRef.current,
      contextSafe: contextSafeRef.current,
    }),
    [],
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
