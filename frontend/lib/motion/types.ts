import type gsap from "gsap";

/**
 * Where an element starts relative to its natural (final) position.
 *
 * "left" starts the element to the left of its final spot, "right" to the
 * right, and so on. "none" keeps the element in place and only fades/scales it.
 */
export type MotionDirection = "left" | "right" | "top" | "bottom" | "none";

/**
 * Named easing variants. The concrete GSAP ease for each variant lives in
 * `easings.ts` so the motion language stays consistent across the app.
 */
export type MotionEaseVariant = "standard" | "entrance" | "smooth" | "move" | "exit" | "expressive";

/**
 * A variant name, or a raw GSAP ease string as an advanced escape hatch
 * (e.g. "power4.out"). Prefer the variants for anything page-level.
 */
export type MotionEase = MotionEaseVariant | (string & {});

/**
 * Viewport buckets aligned with the project's Tailwind breakpoints:
 * mobile < 40rem (640px), tablet 40rem-64rem, desktop >= 64rem (1024px).
 * The auth split layout itself switches to the two-panel view at `lg`/64rem.
 */
export type MotionBreakpoint = "mobile" | "tablet" | "desktop";

/**
 * A single value or a per-breakpoint map. Missing breakpoints cascade down
 * (desktop -> tablet -> mobile), so mobile-first maps stay short.
 */
export type ResponsiveValue<T> = T | Partial<Record<MotionBreakpoint, T>>;

/**
 * One step of an entrance timeline.
 *
 * Entrances animate FROM the values described here TO the element's natural
 * state, so `opacity: 0` means "start invisible", `scale: 1.02` means "start
 * 2% larger". Only transform and opacity are animated.
 */
export type MotionStep = {
  /**
   * Semantic target name. Matches every `[data-motion="<target>"]` element
   * inside the timeline scope. Unknown targets are skipped, which lets one
   * shared layout be reused across screens that do not render every element.
   */
  target: string;
  /** Optional timeline marker placed at this step's start, for later steps to reference. */
  label?: string;
  direction?: MotionDirection;
  distance?: ResponsiveValue<number>;
  duration?: number;
  delay?: number;
  /** Spread across multiple matched elements. */
  stagger?: number;
  /**
   * Starting opacity. Use 1 to skip the fade.
   *
   * Plain opacity keeps hidden content focusable, so it is the default for
   * anything interactive.
   */
  opacity?: number;
  /**
   * Starting autoAlpha (opacity plus `visibility`) for decorative elements
   * that should not be painted at all while hidden, e.g. an overlay. Use 1 to
   * skip. Takes precedence over `opacity` when both are set.
   */
  autoAlpha?: number;
  /** Starting scale. Use 1 (default) to skip the scale. */
  scale?: number;
  /** Starting horizontal scale, for wipes. Use 1 (default) to skip. */
  scaleX?: number;
  /** Starting vertical scale, for wipes. Use 1 (default) to skip. */
  scaleY?: number;
  /** Transform origin for scale-based reveals, e.g. "left center". */
  transformOrigin?: string;
  ease?: MotionEase;
  /**
   * Explicit GSAP timeline position: a number, a label, or relative syntax
   * such as "form", "form+=0.15", "<", ">-=0.2".
   */
  position?: gsap.Position;
  /** Seconds to overlap the previous step. Ignored when `position` is set. */
  overlap?: number;
  /** Skip this step entirely. */
  disabled?: boolean;
  /**
   * Advanced escape hatch: merged last into the tween vars, so it can override
   * anything the semantic API produced. Keep this for cases the API cannot
   * express, not for everyday entrances.
   */
  vars?: gsap.TweenVars;
};

/** Shared defaults applied to every step. */
export type MotionStepDefaults = {
  direction: MotionDirection;
  distance: ResponsiveValue<number>;
  duration: number;
  delay: number;
  stagger: number;
  opacity: number;
  scale: number;
  ease: MotionEase;
  /**
   * Inline properties cleared once a tween completes, so the element is left
   * with no residual transforms and stays correct across resizes.
   */
  clearProps: string;
};

/** Context passed to a step factory once per matched viewport condition. */
export type MotionBuildContext = {
  breakpoint: MotionBreakpoint;
};

/** Build steps that depend on the current viewport (e.g. drop hidden targets). */
export type MotionStepsFactory = (context: MotionBuildContext) => MotionStep[];

/** A static array of steps, or a factory resolved per breakpoint. */
export type MotionSteps = MotionStep[] | MotionStepsFactory;
