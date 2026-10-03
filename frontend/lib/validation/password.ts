import { z } from "zod";

/**
 * Password policy.
 *
 * Mirrors the server rule in
 * `backend/app/Http/Requests/Auth/RegisterRequest.php`:
 *
 *     Password::min(8)->mixedCase()->numbers()->symbols()
 *
 * The frontend previously enforced only `min(8)`, so a password like
 * `password123` passed every client check and came back as a 422 after the round
 * trip. Keep the two in step — if you change one, change the other.
 *
 * `PASSWORD_MIN_LENGTH` is also the source of truth for the strength meter's
 * first threshold, so the meter cannot call a rejected password "Strong".
 */
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

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .max(PASSWORD_MAX_LENGTH, "Password is too long")
  .refine((value) => value.length >= PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
    "Password must contain an uppercase and a lowercase letter",
  )
  .refine((value) => /\d/.test(value), "Password must contain at least one number")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Password must contain at least one symbol");

export function passwordError(value: string): string | undefined {
  const result = passwordSchema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? "Password is required";
}

export type PasswordStrengthLevel = "weak" | "fair" | "strong";

/**
 * Score a password against the actual policy rather than its length.
 *
 * Length alone was misleading: `abcdefgh` scored "Weak" but so did
 * `password123`, and a genuinely strong short password scored the same as a long
 * weak one. Counting satisfied requirements lines the meter up with what submit
 * will accept.
 */
export function passwordStrengthLevel(value: string): PasswordStrengthLevel {
  const satisfied = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  if (satisfied <= 1) return "weak";
  if (satisfied === 2 || satisfied === 3) return "fair";
  return "strong";
}
