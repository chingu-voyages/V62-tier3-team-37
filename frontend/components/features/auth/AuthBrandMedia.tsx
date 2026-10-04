"use client";

import Image from "next/image";
import { GsapTimeline } from "@/components/motion";
import type { MotionStep } from "@/lib/motion";

/**
 * Local timeline for the brand photo and its contrast overlay.
 *
 * This is deliberately not part of the page entrance: the overlay can only
 * play once the photo has decoded, so `waitForMedia` holds it at its start
 * state and releases it when the image can paint. On a slow connection the
 * gradient sweeps in after the image lands instead of over a blank panel.
 *
 * `autoAlpha` is used because the overlay is decorative (aria-hidden and
 * pointer-events-none): keeping it unpainted while hidden is exactly right.
 * Under reduced motion no timeline is built, so the overlay is simply there.
 */
const overlaySteps: MotionStep[] = [
  {
    target: "brand-overlay",
    direction: "none",
    autoAlpha: 0,
    scaleX: 0,
    transformOrigin: "left center",
    duration: 0.85,
    ease: "power3.inOut",
  },
];

export function AuthBrandMedia({ className }: { className?: string }) {
  return (
    <div data-motion="brand-image" className={className}>
      <GsapTimeline waitForMedia steps={overlaySteps} className="absolute inset-0">
        <Image
          data-motion-media
          src="/images/auth/background-signup.webp"
          alt=""
          fill
          sizes="(min-width: 64rem) 42vw, 100vw"
          loading="lazy"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          data-motion="brand-overlay"
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent"
        />
      </GsapTimeline>
    </div>
  );
}
