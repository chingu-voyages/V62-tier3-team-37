/**
 * Shared helper for surfacing a single field error at an appropriate
 * interaction point: once the field has been touched (blurred) or the form
 * has been submitted once, the first error message is revealed. Until then
 * the field renders without an error to keep the UI calm.
 */
export function firstTouchedError(meta: {
  isTouched: boolean;
  errors: readonly (string | undefined)[];
}): string | undefined {
  return meta.isTouched ? meta.errors[0] : undefined;
}
