"use client";

import type { ReactNode } from "react";
import { GsapTimeline } from "@/components/motion";
import type { MotionBuildContext, MotionStep } from "@/lib/motion";

/**
 * Entrance choreography for the auth screens.
 *
 * The story: the brand visual settles first, its content follows from the
 * left, then the form column arrives from the right and rises from below.
 * The whole sequence is over in roughly a second so the user can get on with
 * signing in.
 *
 * The factory drops the brand steps below `lg`, where the split shell hides
 * the brand panel, so small screens never wait on invisible elements.
 */
function buildAuthSteps({ breakpoint }: MotionBuildContext): MotionStep[] {
  const wide = breakpoint === "desktop";
  const steps: MotionStep[] = [];

  if (wide) {
    steps.push(
      {
        // No `autoAlpha` here on purpose. This photo is the page's LCP element,
        // and LCP is only recorded once the element is actually painted. Fading
        // the panel in from 0 meant the image was downloaded at ~80ms but stayed
        // invisible until hydration finished and this tween ran, which showed up
        // as a multi-second "element render delay" in the audit. The photo now
        // paints on the first frame and still settles into place — the slide and
        // the scale-down are the same, only the opacity gate is gone. The dark
        // gradient in `AuthBrandMedia` still sweeps over it, and `brand-content`
        // still fades in, so the reveal choreography is unchanged.
        //
        // `opacity: 1` is explicit, not redundant: dropping `autoAlpha` alone
        // would fall through to `motionDefaults.opacity` (0) and re-introduce
        // the exact fade this step is avoiding.
        target: "brand-image",
        label: "brand",
        direction: "left",
        scale: 1.22,
        duration: 0.8,
        ease: "entrance",
        opacity: 1,
      },
      {
        target: "brand-content",
        direction: "left",
        distance: { tablet: 26, desktop: 34 },
        duration: 0.8,
        ease: "entrance",
        position: "brand-image+=0.07",
      },
    );
  }

  steps.push(
    {
      // Same reasoning as `brand-image`: `opacity: 1` is explicit so the step
      // falls through neither to `motionDefaults.opacity` (0) nor to the
      // pre-paint frame in globals.css. Below `lg` — where the split shell
      // hides the brand panel — this heading is the largest content on the page
      // and therefore the LCP element, and LCP is only recorded once the element
      // is actually painted. Fading it in meant the heading, the stepper and
      // the card were all invisible until this timeline ran, which is the render
      // delay LCP measures. They now rise into place already visible.
      target: "heading",
      label: "form",
      position: wide ? "brand+=0.36" : 0.05,
      direction: "bottom",
      distance: { mobile: 12, tablet: 24, desktop: 28 },
      duration: 0.6,
      ease: "entrance",
      opacity: 1,
    },
    {
      target: "step",
      position: "form",
      direction: "none",
      duration: 0.5,
      ease: "standard",
      opacity: 1,
    },
    {
      target: "subheading",
      position: "form+=0.08",
      direction: "bottom",
      distance: { mobile: 10, tablet: 14, desktop: 18 },
      duration: 0.55,
      ease: "entrance",
      opacity: 1,
    },
    {
      target: "role-switch",
      position: "form+=0.14",
      direction: "bottom",
      distance: { mobile: 8, tablet: 10, desktop: 12 },
      duration: 0.5,
      ease: "smooth",
      opacity: 1,
    },
    {
      target: "sliding-tabs",
      position: "form+=0.18",
      direction: "bottom",
      distance: { mobile: 8, tablet: 10, desktop: 12 },
      duration: 0.5,
      ease: "smooth",
      opacity: 1,
    },
    {
      target: "card",
      label: "card",
      position: "form+=0.24",
      direction: "top",
      distance: { mobile: 14, tablet: 20, desktop: 30 },
      duration: 0.65,
      ease: "entrance",
      opacity: 1,
    },
  );

  return steps;
}

export function AuthPageMotion({ children }: { children: ReactNode }) {
  return (
    <GsapTimeline steps={buildAuthSteps} labels={{ finish: "card+=0.65" }}>
      {children}
    </GsapTimeline>
  );
}
