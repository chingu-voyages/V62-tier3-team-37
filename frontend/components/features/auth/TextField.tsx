import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

/**
 * Label + input + single-line error pairing shared by both auth forms.
 *
 * `error` is presentational: the caller is expected to already gate it to the
 * right interaction point (touched/submitted) and may pass `undefined`.
 */
export function TextField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
