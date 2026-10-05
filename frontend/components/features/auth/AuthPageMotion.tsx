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
        target: "brand-image",
        label: "brand",
        direction: "left",
        scale: 1.22,
        duration: 0.8,
        ease: "entrance",
        autoAlpha: 0,
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
      target: "heading",
      label: "form",
      position: wide ? "brand+=0.36" : 0.05,
      direction: "bottom",
      distance: { mobile: 12, tablet: 24, desktop: 28 },
      duration: 0.6,
      ease: "entrance",
    },
    {
      target: "step",
      position: "form",
      direction: "none",
      duration: 0.5,
      ease: "standard",
    },
    {
      target: "subheading",
      position: "form+=0.08",
      direction: "bottom",
      distance: { mobile: 10, tablet: 14, desktop: 18 },
      duration: 0.55,
      ease: "entrance",
    },
    {
      target: "role-switch",
      position: "form+=0.14",
      direction: "bottom",
      distance: { mobile: 8, tablet: 10, desktop: 12 },
      duration: 0.5,
      ease: "smooth",
    },
    {
      target: "card",
      label: "card",
      position: "form+=0.24",
      direction: "top",
      distance: { mobile: 14, tablet: 20, desktop: 30 },
      duration: 0.65,
      ease: "entrance",
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
