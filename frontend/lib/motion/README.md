# Motion system

A small, reusable GSAP timeline layer. Pages declare **what** should arrive and
**how** it relates to the rest of the entrance; the motion layer owns GSAP,
lifecycle, responsiveness and reduced-motion behavior.

Current consumers: the auth screens (`components/features/auth/AuthPageMotion.tsx`
for the entrance, `AuthBrandMedia.tsx` for the media-gated overlay).

## Usage

```tsx
"use client";

import { GsapTimeline } from "@/components/motion";
import type { MotionStep } from "@/lib/motion";

const steps: MotionStep[] = [
  { target: "heading", direction: "right", ease: "entrance" },
  { target: "card", direction: "bottom", position: "heading+=0.15" },
];

export function PageMotion({ children }: { children: React.ReactNode }) {
  return <GsapTimeline steps={steps}>{children}</GsapTimeline>;
}
```

`steps` can also be a factory, `(context) => MotionStep[]`, which is called once
per viewport condition. Use it when a breakpoint changes the structure of the
choreography (for example, dropping the steps for a panel that is hidden on
mobile), not just the distances.

## Targets

Add a semantic attribute to the existing element. The component stays
GSAP-agnostic; it only says "this element can be animated".

```tsx
<h1 data-motion="heading">Create your account</h1>
```

- Targets are scoped to the `GsapTimeline` root. No global DOM queries.
- One target can match several elements; the step animates all of them.
- Unknown targets are skipped, so one shared layout can serve screens that do
  not render every element.

## Directions

`left` / `right` / `top` / `bottom` start the element that far from its final
position (`left` = starts left, `right` = starts right, ...). `none` keeps it in
place. The distance comes from `distance`, or from the default preset.

Scales and wipes are expressed with `scale`, `scaleX`, `scaleY` and
`transformOrigin`:

```tsx
{ target: "overlay", direction: "none", autoAlpha: 0, scaleX: 0, transformOrigin: "left center" }
```

`opacity` (default) keeps hidden content focusable, so use it for anything
interactive. `autoAlpha` also toggles `visibility`, so use it for decorative
elements that should not be painted while hidden.

## Distances and responsive values

```tsx
{ target: "card", direction: "bottom", distance: { mobile: 16, tablet: 22, desktop: 30 } }
```

Breakpoints match Tailwind: mobile `< 40rem`, tablet `40rem-64rem`, desktop
`>= 64rem`. Missing entries cascade mobile-first (desktop -> tablet -> mobile).

## Easing variants

`ease` accepts `standard`, `entrance`, `smooth`, `move`, `exit`, `expressive`
(values in `easings.ts`). A raw GSAP ease string is accepted as an escape hatch.

## Choreography, labels and positions

```tsx
[
  { target: "brand-image", label: "brand", direction: "none", scale: 1.02 },
  { target: "heading", label: "form", position: "brand+=0.35", direction: "right" },
  { target: "card", position: "form+=0.24", direction: "bottom" },
]
```

- `label` names a point in the timeline for later steps to reference.
- `position` is a GSAP position: a number (absolute), a label, `"form+=0.15"`,
  or relative syntax such as `"<"` / `">-=0.2"`. It may only reference labels
  declared by earlier steps.
- `overlap: 0.2` is sugar for `">-=0.2"` (starts 0.2s before the previous step
  ends). `position` wins when both are set.
- The `labels` prop adds static markers after the steps, so `{ finish: "card+=0.65" }`
  is valid because `card` is declared by a step.

Steps are skipped when `disabled: true` or when their target is missing.

## Waiting for media

`waitForMedia` holds a timeline at its start state until every
`[data-motion-media]` image inside the scope can paint, then plays it. The
start state is applied immediately, so nothing flashes while the image loads.
Cached images whose load event fired before hydration are handled, and a
broken source resolves too, so a failed image can never leave content hidden.

```tsx
<GsapTimeline waitForMedia steps={overlaySteps}>
  <Image data-motion-media src="..." alt="" fill sizes="..." loading="lazy" />
  <div data-motion="overlay" aria-hidden="true" />
</GsapTimeline>
```

Use it for reveals that depend on the real image (photo overlays, hero settles),
not for the main page entrance; text and controls should never wait on a photo.

## Pre-hydration start state

On slow connections JS can land well after the first paint. To stop animated
elements from flashing and then re-animating on hydration, `app/layout.tsx`
adds `motion-enabled` to `<html>` in a pre-paint script when JS is available
and reduced motion is not requested. `globals.css` uses that class to freeze
the auth targets in their entrance start state, and the engine removes the
class right before it builds its first timeline. The script also has a timeout
that removes the class if hydration never happens, so a failed bundle can only
ever degrade to the final, visible state.

## Reduced motion

Every matchMedia condition requires `prefers-reduced-motion: no-preference`.
When a visitor asks for reduced motion, no timeline is built, no `from()` state
is applied and the page simply renders in its final state. There is never a
state where content depends on JS to become visible.

## Lifecycle and responsiveness

- `useGSAP` + a scoped root ref own creation and cleanup; a matchMedia branch
  is reverted and rebuilt when the viewport crosses a breakpoint.
- Completed tweens clear their inline `transform`/`transformOrigin`/`opacity`/
  `visibility`, so no stale styles survive a resize.
- Strict Mode double-mounts are safe: cleanup reverts everything before the
  timeline is rebuilt.

## Timeline control

`GsapTimeline` autoplays by default. For controlled sequences, pass a ref:

```tsx
const timeline = useRef<GsapTimelineHandle>(null);
<GsapTimeline ref={timeline} steps={steps} paused>...</GsapTimeline>
```

The handle exposes `play`, `pause`, `resume`, `reverse`, `restart`, `seek`,
`progress`, `kill`, `revert`, `getTimeline` and `contextSafe`. A paused timeline
renders its `from()` state immediately (everything hidden) until played.

## contextSafe

Animations created after the timeline callback (click, hover, timers) must be
registered with the component's context or they will not be cleaned up. Use the
`contextSafe` exposed on the handle, or call `useGSAP` in the component that
owns the interaction:

```tsx
const { contextSafe } = useGSAP({ scope: root });
const onHover = contextSafe(() => gsap.to(el, { scale: 1.02, ease: "standard" }));
```

## Advanced escape hatch

`step.vars` is merged last into the GSAP tween vars for cases the semantic API
cannot express. Everyday page code should use `target`/`direction`/`distance`/
`duration`/`ease`/`position` instead.
