import { cn } from "@/lib/utils";

export type ProfileFieldRowProps = {
  label: string;
  value?: string | null;
  /** Secondary line, e.g. a workplace address under its name. */
  subValue?: string | null;
  className?: string;
};

/**
 * A label/value pair, with an optional secondary line.
 *
 * Four different private implementations of this existed — `Field` in
 * `ProfileProfessional`, `MetaItem` in `ProfileOverview`, an inline row in
 * `ProfileVerification`, and the range rows in `ProfileAvailabilitySection` —
 * which is why two of them disagreed about whether a `subValue` survives when
 * `value` is missing.
 */
export function ProfileFieldRow({ label, value, subValue, className }: ProfileFieldRowProps) {
  const hasValue = Boolean(value);
  const hasSubValue = Boolean(subValue);

  if (!hasValue && !hasSubValue) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <dt className="type-helper text-muted-foreground">{label}</dt>
      {hasValue ? (
        <dd className="mt-0.5 type-body wrap-break-word text-foreground">{value}</dd>
      ) : null}
      {hasSubValue ? (
        <p className="mt-0.5 type-helper wrap-break-word text-muted-foreground">{subValue}</p>
      ) : null}
    </div>
  );
}

/**
 * Whether a field has anything worth rendering.
 *
 * Checks `subValue` as well as `value`: the previous version only checked
 * `value`, so an HCP who had entered a workplace address but not yet a workplace
 * name lost the address entirely.
 */
export function hasProfileField(value?: string | null, subValue?: string | null): boolean {
  return Boolean(value) || Boolean(subValue);
}
