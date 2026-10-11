"use client";

import type { gsap as GSAPNamespace } from "gsap";

/** The GSAP core namespace, as returned by the dynamic import. */
export type GsapCore = typeof GSAPNamespace;

let engine: Promise<GsapCore> | null = null;

/**
 * Load the animation engine, once, on demand.
 *
 * GSAP is roughly 170 KB of source — about 50 KB parsed — and none of it is
 * needed to *render* anything. This module used to import `gsap` and
 * `@gsap/react` statically, which put the whole engine in the route's initial
 * bundle and forced it to be parsed and executed during hydration, inside the
 * FCP→TTI window that TBT measures.
 *
 * Loading it through `import()` instead means:
 *   - it is a separate chunk that is fetched and parsed *after* the page is
 *     interactive, so none of it counts toward blocking time;
 *   - the consumers can batch their setup into a single task rather than each
 *     one paying for it inside React's commit phase (see `scheduleMotion`).
 *
 * The promise is memoised, so every consumer shares one network request and one
 * parse no matter how many timelines mount.
 */
export function loadGsap(): Promise<GsapCore> {
  engine ??= import("gsap").then((module) => module.gsap);
  return engine;
}

/**
 * Run queued work after the hydrated frame has painted — one entry per frame.
 *
 * Every motion consumer registers here instead of building its timeline
 * directly in an effect, which keeps setup out of the synchronous commit that
 * hydration runs in.
 *
 * Deliberately **one task per animation frame** rather than draining the whole
 * queue in a single callback. TBT charges the excess over 50ms for each long
 * task, so draining three timelines together produced one ~300ms task and
 * measured *worse* than the commit it was meant to avoid. Spreading them lands
 * the same work as smaller tasks, and gives the browser a frame boundary — and
 * a chance to handle input — in between.
 */
type MotionTask = () => void;

const queue: MotionTask[] = [];
let running = false;

function drainOne() {
  const task = queue.shift();
  if (!task) {
    running = false;
    return;
  }
  // Schedule the next entry first, so this frame only ever does one timeline.
  requestAnimationFrame(drainOne);
  task();
}

export function scheduleMotion(task: MotionTask): () => void {
  queue.push(task);
  if (!running) {
    running = true;
    requestAnimationFrame(drainOne);
  }
  return () => {
    const index = queue.indexOf(task);
    if (index >= 0) queue.splice(index, 1);
  };
}
