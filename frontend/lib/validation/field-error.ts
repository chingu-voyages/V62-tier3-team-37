/**
 * Reveal a field's first validation message once it has been touched.
 *
 * TanStack Form marks every field as touched when the form is submitted, so this
 * single check covers both "blurred" and "submit attempted" without every call
 * site tracking a separate `isSubmitted` flag.
 */
export function firstTouchedError(meta: {
  isTouched: boolean;
  errors: readonly unknown[];
}): string | undefined {
  if (!meta.isTouched) return undefined;
  const [first] = meta.errors;
  return typeof first === "string" ? first : undefined;
}
