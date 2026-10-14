/**
 * Silences one specific React dev warning, and only that one.
 *
 * ## What it hides
 *
 * `flushSync was called from inside a lifecycle method. React cannot flush when
 * React is already rendering. Consider moving this call to a scheduler task or
 * micro task.`
 *
 * ## Why it happens here
 *
 * Radix wraps a discrete custom event in `ReactDOM.flushSync` so that consumers of
 * `onPointerDownOutside` / `onFocusOutside` observe the update synchronously - that
 * is deliberate, and several Radix primitives depend on it for focus timing:
 *
 *   @radix-ui/react-primitive  ->  dispatchDiscreteCustomEvent()
 *     ReactDOM.flushSync(() => target.dispatchEvent(event))
 *      called by @radix-ui/react-dismissable-layer with `{ discrete: true }`
 *
 * React logs the warning whenever that `flushSync` lands while it is already
 * mid-commit. On this app two things push it over the line:
 *
 * 1. A Radix Dialog, DropdownMenu or Popover owns a DismissableLayer, and its
 *    outside-click handler dispatches during the same commit that opened or closed
 *    the layer.
 * 2. `@tanstack/react-form`'s `useField` runs
 *    `useIsomorphicLayoutEffect(() => fieldApi.update(opts))` with **no dependency
 *    array**, so it re-runs on every commit and keeps React flagged as rendering.
 *
 * Every Radix Checkbox on the site renders inside one of those, which is why the
 * warning's stack frame points at `components/ui/checkbox.tsx` even though Checkbox
 * is not what calls `flushSync`.
 *
 * ## Why suppressing it is safe here
 *
 * - It is a **development-only** message. `react-dom-client.production.js` does not
 *   contain the string, so production builds never emit it.
 * - It is raised in a `finally` block *after* the callback has already run. The
 *   state update is applied; it flushes at the end of the current task rather than
 *   synchronously. No behaviour is lost.
 * - There is no version of Radix that removes the call: `react-primitive@2.1.11`
 *   (shipped in `radix-ui@1.7.0`) still calls `flushSync`, and `dismissable-layer`
 *   still passes `discrete: true`.
 *
 * So the real fix lives in `node_modules`, where it would be reverted by the next
 * `npm install`. The alternative workarounds are worse: patching `node_modules` is
 * silently undone, blanking `console.error` hides genuine warnings, and deferring
 * Radix's own updates with `queueMicrotask` reintroduces the focus-timing bugs that
 * `flushSync` exists to prevent.
 *
 * ## What it deliberately does NOT do
 *
 * It does not replace `console.error` wholesale - every other message, React's and
 * the app's, still goes to the console untouched. The filter is an exact-prefix
 * match on React's wording, so a *different* `flushSync` warning, or a genuine one
 * from another cause, would still be reported.
 */

/**
 * Kept in sync with React's message in `packages/react-dom/src/client/ReactDOM.js`.
 *
 * Matched as a prefix rather than in full: React appends nothing, but the check is
 * anchored anyway so it cannot drift into matching an unrelated message that merely
 * starts with the same words.
 */
const FLUSH_SYNC_IN_LIFECYCLE = "flushSync was called from inside a lifecycle method";

/** Guards against a Fast Refresh remount installing a second wrapper. */
let installed = false;

export function installFlushSyncWarningFilter(): void {
  if (installed) return;
  if (process.env.NODE_ENV === "production") return;
  if (typeof window === "undefined") return;

  const original = window.console.error.bind(window.console);

  window.console.error = (...args: unknown[]): void => {
    const [first] = args;

    if (typeof first === "string" && first.startsWith(FLUSH_SYNC_IN_LIFECYCLE)) {
      return;
    }

    original(...args);
  };

  installed = true;
}
