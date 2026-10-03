import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed, lowercased email. The single definition used by every layer. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .max(254, "Email address is too long")
  .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address")
  .transform((value) => value.toLowerCase());

export function emailError(value: string): string | undefined {
  const result = emailSchema.safeParse(value);
  return result.success
    ? undefined
    : (result.error.issues[0]?.message ?? "Enter a valid email address");
}
