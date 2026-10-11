/**
 * Field-level validation rules, with no schema library.
 *
 * These mirror the zod schemas in `schemas.ts` exactly — same checks, same
 * order, same messages — but as plain functions. That matters because a zod
 * import pulls the whole schema builder into the route's initial bundle, and
 * merely *constructing* the schemas costs ~170ms of main-thread time at module
 * evaluation. Field validators run while the visitor is typing, so they cannot
 * wait on a lazy chunk; they have to be free.
 *
 * `schemas.ts` still owns the form-level submit gate, where a real object schema
 * is the right tool and the cost is paid once, on submit, off the critical path.
 *
 * When a rule changes, change it in both places. `rules.ts` and `schemas.ts` are
 * deliberately side by side so the duplication is obvious rather than hidden.
 */

/** Password policy. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RULES = [
  {
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
    message: `at least ${PASSWORD_MIN_LENGTH} characters`,
  },
  {
    test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value),
    message: "an uppercase and a lowercase letter",
  },
  { test: (value: string) => /\d/.test(value), message: "at least one number" },
  { test: (value: string) => /[^A-Za-z0-9]/.test(value), message: "at least one symbol" },
] as const;

export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

/** The unmet requirements for a password, in policy order. Empty when valid. */
export function unmetPasswordRules(value: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.message);
}

const hasMixedCase = (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value);
const hasNumber = (value: string) => /\d/.test(value);
const hasSymbol = (value: string) => /[^A-Za-z0-9]/.test(value);

/**
 * First unmet rule, in the same order `passwordSchema` declares them.
 *
 * The order is load-bearing: zod reports the first failing check, and the user
 * is walked through the policy one step at a time. Reporting "too long" before
 * "too short" — or fixing "add a number" before the missing uppercase — would
 * make the form nag about a rule the visitor has not reached yet.
 */
export function passwordError(value: string): string | undefined {
  if (value.length === 0) return "Password is required";
  if (value.length > PASSWORD_MAX_LENGTH) return "Password is too long";
  if (value.length < PASSWORD_MIN_LENGTH) return PASSWORD_MIN_LENGTH_MESSAGE;
  if (!hasMixedCase(value)) return "Password must contain an uppercase and a lowercase letter";
  if (!hasNumber(value)) return "Password must contain at least one number";
  if (!hasSymbol(value)) return "Password must contain at least one symbol";
  return undefined;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors `emailSchema` — trim, then presence, then length, then shape. */
export function emailError(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Email address is required";
  if (trimmed.length > 254) return "Email address is too long";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address";
  return undefined;
}

const today = new Date();
export const MAX_DATE_OF_BIRTH_YEAR = today.getFullYear();
export const MIN_DATE_OF_BIRTH_YEAR = 1900;

/** Mirrors `dateOfBirthSchema`; `value` is a `YYYY-MM-DD` string. */
export function dateOfBirthError(value: string): string | undefined {
  if (value.length === 0) return "Date of birth is required";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return `Enter a valid date of birth (${MIN_DATE_OF_BIRTH_YEAR}–${MAX_DATE_OF_BIRTH_YEAR})`;
  }
  const year = parsed.getUTCFullYear();
  if (year < MIN_DATE_OF_BIRTH_YEAR || year > MAX_DATE_OF_BIRTH_YEAR) {
    return `Enter a valid date of birth (${MIN_DATE_OF_BIRTH_YEAR}–${MAX_DATE_OF_BIRTH_YEAR})`;
  }
  return undefined;
}

const requiredName = (value: string, label: string) => {
  if (value.trim().length === 0) return `${label} is required`;
  if (value.length > 80) return `${label} is too long`;
  return undefined;
};

export const firstNameError = (value: string) => requiredName(value, "First name");
export const lastNameError = (value: string) => requiredName(value, "Last name");

export const genderError = (value: string) =>
  value === "male" || value === "female" ? undefined : "Select your gender";

export const termsError = (value: boolean) =>
  value === true ? undefined : "You must accept the terms and conditions";

export type PasswordStrengthLevel = "weak" | "fair" | "strong";

/**
 * Score a password against the actual policy rather than its length.
 *
 * Counting satisfied requirements lines the meter up with what submit will
 * accept, so the meter cannot call a rejected password "Strong".
 */
export function passwordStrengthLevel(value: string): PasswordStrengthLevel {
  const satisfied = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  if (satisfied <= 1) return "weak";
  if (satisfied === 2 || satisfied === 3) return "fair";
  return "strong";
}
