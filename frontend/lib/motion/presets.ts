import type { MotionStepDefaults } from "./types";

/**
 * The default entrance preset: a short, restrained rise from below.
 *
 * Consumers override per step (or override the whole preset through the
 * `defaults` prop) rather than re-declaring every value. Distances are
 * responsive on purpose: large desktop panels should not travel the same
 * number of pixels as a narrow phone layout.
 */
export const motionDefaults: MotionStepDefaults = {
  direction: "bottom",
  distance: { mobile: 14, tablet: 20, desktop: 28 },
  duration: 0.55,
  delay: 0,
  stagger: 0,
  opacity: 0,
  scale: 1,
  ease: "entrance",
  clearProps: "transform,transformOrigin,opacity,visibility",
};
