import type { MotionEase, MotionEaseVariant } from "./types";

/**
 * The single source of truth for motion easing.
 *
 * A small family on purpose: entrance/standard/smooth cover almost every
 * entrance, `move` and `exit` are for state transitions, and `expressive`
 * (a restrained overshoot) is opt-in rather than the default.
 */
export const motionEases = {
  /** Neutral ease-out for simple fades and in-place reveals. */
  standard: "power2.out",
  /** Strong but smooth ease-out for elements arriving on screen. */
  entrance: "power3.out",
  /** Softer, quieter ease-out for large surfaces. */
  smooth: "sine.out",
  /** Balanced in/out for elements that move between two on-screen states. */
  move: "power2.inOut",
  /** Ease-in for elements leaving the screen. */
  exit: "power2.in",
  /** Restrained overshoot. Use sparingly and only for emphasis. */
  expressive: "back.out(1.2)",
} as const satisfies Record<MotionEaseVariant, string>;

/**
 * Translate a variant into a GSAP ease string. Unknown values pass through
 * unchanged, which is the supported raw-string escape hatch.
 */
export function resolveEase(ease: MotionEase | undefined): string {
  if (!ease) return motionEases.entrance;
  return ease in motionEases ? motionEases[ease as MotionEaseVariant] : ease;
}
