import { FieldMessage } from "@/components/ui/field-message";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldRenderProps = {
  /** Id to put on the control so `<Label htmlFor>` resolves. */
  id: string;
  /** Id of the error/hint text, for `aria-describedby`. `undefined` when there is none. */
  describedBy: string | undefined;
  /** True when the field is in an invalid state, for `aria-invalid`. */
  invalid: boolean;
};

type FormFieldProps = {
  id: string;
  label: string;
  /** Set when a visible `<Label htmlFor={id}>` is rendered by the caller. */
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Render the control. Receives the a11y wiring so callers cannot forget it. */
  children: (props: FormFieldRenderProps) => React.ReactNode;
};

/**
 * The single form-field primitive: label, control and message, correctly wired
 * together.
 *
 * This replaces four hand-rolled variants that had drifted apart — the auth
 * `TextField`/`PasswordField` pair, the `Field` helper inside `PatientAppointments`,
 * and three inline copies in `HcpVerificationForm` (two of which never set
 * `aria-describedby` at all). Callers cannot get the accessibility wiring wrong
 * because they never write it.
 */
export function FormField({
  id,
  label,
  hideLabel,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {hideLabel ? null : (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="text-destructive">
                {" "}
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </Label>
      )}

      {children({
        id,
        describedBy: describedBy.length > 0 ? describedBy : undefined,
        invalid: Boolean(error),
      })}

      {hint ? (
        <p id={hintId} className="type-helper text-muted-foreground">
          {hint}
        </p>
      ) : null}

      <FieldMessage id={error ? errorId : undefined}>{error}</FieldMessage>
    </div>
  );
}
