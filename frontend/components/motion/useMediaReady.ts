"use client";

import { type RefObject, useEffect, useState } from "react";

/** Images inside a motion scope that a media-gated timeline should wait for. */
const MEDIA_SELECTOR = "[data-motion-media]";

function whenImageReady(image: HTMLImageElement): Promise<void> {
  const decode = () => {
    const decoded = image.decode?.();
    return decoded ? decoded.catch(() => undefined) : Promise.resolve();
  };

  // Cached images can report `complete` before hydration. Decoding makes sure
  // the first painted frame is real pixels, not a blank box.
  if (image.complete && image.naturalWidth > 0) return decode();

  // A broken source must never block the timeline; let it play over the panel.
  if (image.complete) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const done = () => {
      if (image.naturalWidth > 0) {
        void decode().then(resolve);
      } else {
        resolve();
      }
    };

    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
  });
}

/**
 * True once every `[data-motion-media]` image inside the scope can paint.
 *
 * Handles the cases that make image-driven animation flaky: cached images
 * whose load event fired before hydration, images still in flight, and broken
 * sources (errors resolve too, so a failed image can never leave the page
 * stuck in its pre-animation state).
 */
export function useMediaReady(rootRef: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const images = Array.from(root.querySelectorAll<HTMLImageElement>(MEDIA_SELECTOR));
    let cancelled = false;

    void Promise.all(images.map((image) => whenImageReady(image))).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [rootRef, enabled]);

  return !enabled || ready;
}
