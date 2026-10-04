import type gsap from "gsap";
import type { MotionBreakpoint, MotionDirection, ResponsiveValue } from "./types";

/** Attribute that connects DOM to the motion layer. */
const MOTION_ATTRIBUTE = "data-motion";

/** Semantic target names only: letters, digits and hyphens. */
const MOTION_TARGET_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

/**
 * Media queries the reusable timeline listens to.
 *
 * `prefers-reduced-motion: no-preference` is part of every condition, so a
 * reduced-motion visitor matches nothing and the timeline is never built.
 * Content therefore stays in its final, natural state with no inline styles.
 *
 * Breakpoints match the project's Tailwind scale (sm = 40rem, lg = 64rem) and
 * the auth shell's own lg switch to the two-panel layout. Range syntax is used
 * so the buckets cannot overlap or leave gaps.
 */
export const motionMediaQueries = {
  isMobile: "(prefers-reduced-motion: no-preference) and (width < 40rem)",
  isTablet: "(prefers-reduced-motion: no-preference) and (width >= 40rem) and (width < 64rem)",
  isDesktop: "(prefers-reduced-motion: no-preference) and (width >= 64rem)",
} as const;

/** Map GSAP matchMedia conditions to the single breakpoint that matched. */
export function resolveBreakpoint(
  conditions: Record<string, boolean> | undefined,
): MotionBreakpoint {
  if (conditions?.isDesktop) return "desktop";
  if (conditions?.isTablet) return "tablet";
  return "mobile";
}

/**
 * Resolve a responsive value for the active breakpoint. Missing entries
 * cascade mobile-first (desktop -> tablet -> mobile), then fall back.
 */
export function resolveResponsiveValue<T>(
  value: ResponsiveValue<T> | undefined,
  fallback: T,
  breakpoint: MotionBreakpoint,
): T {
  if (value === undefined) return fallback;
  if (typeof value !== "object" || value === null) return value;

  const byBreakpoint = value as Partial<Record<MotionBreakpoint, T>>;
  const cascade: MotionBreakpoint[] =
    breakpoint === "desktop"
      ? ["desktop", "tablet", "mobile"]
      : breakpoint === "tablet"
        ? ["tablet", "mobile"]
        : ["mobile"];

  for (const candidate of cascade) {
    const resolved = byBreakpoint[candidate];
    if (resolved !== undefined) return resolved;
  }

  return fallback;
}

/** Translate a direction + distance into the starting transform. */
export function directionToTweenVars(direction: MotionDirection, distance: number): gsap.TweenVars {
  if (direction === "left") return { x: -distance };
  if (direction === "right") return { x: distance };
  if (direction === "top") return { y: -distance };
  if (direction === "bottom") return { y: distance };
  return {};
}

/**
 * Find the elements a semantic target refers to, scoped to the timeline root.
 * Empty results are normal: a shared layout animates whatever each screen
 * actually renders, and steps without matches are skipped.
 */
export function resolveMotionTargets(root: HTMLElement, target: string): HTMLElement[] {
  if (!MOTION_TARGET_PATTERN.test(target)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[motion] Ignoring invalid target "${target}". Use a semantic name like "heading".`,
      );
    }
    return [];
  }

  return Array.from(root.querySelectorAll<HTMLElement>(`[${MOTION_ATTRIBUTE}="${target}"]`));
}
