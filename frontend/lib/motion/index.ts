/**
 * Public, server-safe surface of the motion layer.
 *
 * The barrel intentionally does not re-export `gsap`/`useGSAP`; only the
 * reusable client components in `components/motion` import the engine. This
 * keeps GSAP out of any module graph that does not actually animate.
 */
export { motionEases, resolveEase } from "./easings";
export { motionDefaults } from "./presets";
export {
  directionToTweenVars,
  motionMediaQueries,
  noPreferenceMotionQuery,
  reducedMotionQuery,
  resolveBreakpoint,
  resolveMotionTargets,
  resolveResponsiveValue,
} from "./resolve";
export type {
  MotionBreakpoint,
  MotionBuildContext,
  MotionDirection,
  MotionEase,
  MotionEaseVariant,
  MotionStep,
  MotionStepDefaults,
  MotionSteps,
  MotionStepsFactory,
  ResponsiveValue,
} from "./types";
