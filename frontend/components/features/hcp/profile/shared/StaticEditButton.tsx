import { Pencil } from "lucide-react";

type StaticEditButtonProps = {
  /** Describes the intended action for assistive technology. */
  label: string;
};

/**
 * Presentational edit affordance. Editing is out of scope for the profile
 * feature, so the control is inert: it is marked `aria-disabled` and carries no
 * handler, form association, or navigation target.
 */
export function StaticEditButton({ label }: StaticEditButtonProps) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Pencil className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
