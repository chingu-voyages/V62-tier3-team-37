import { z } from "zod";
import { emailSchema } from "./email";
import { passwordSchema } from "./password";

/**
 * Form-level schemas.
 *
 * These exist so submit is actually gated: the forms previously declared only
 * `onChange` validators, which meant a required field left blank was still posted
 * and Laravel's 422 was the only thing stopping it. Field-level schemas are
 * exported alongside the form schemas so the same rule drives both the inline
 * message and the submit check.
 */

const today = new Date();
export const MAX_DATE_OF_BIRTH_YEAR = today.getFullYear();
export const MIN_DATE_OF_BIRTH_YEAR = 1900;

export const firstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required")
  .max(80, "First name is too long");

export const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required")
  .max(80, "Last name is too long");

export const dateOfBirthSchema = z
  .string()
  .min(1, "Date of birth is required")
  .refine((value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const year = parsed.getUTCFullYear();
    return year >= MIN_DATE_OF_BIRTH_YEAR && year <= MAX_DATE_OF_BIRTH_YEAR;
  }, `Enter a valid date of birth (${MIN_DATE_OF_BIRTH_YEAR}–${MAX_DATE_OF_BIRTH_YEAR})`);

export const genderSchema = z.enum(["male", "female"], {
  message: "Select your gender",
});

export const termsSchema = z.literal(true, {
  message: "You must accept the terms and conditions",
});

/**
 * Sign-in only checks that a password was supplied. Re-applying `passwordSchema`
 * here would lock out accounts created before the policy was tightened, so this
 * deliberately uses a presence check alone.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    dateOfBirth: dateOfBirthSchema,
    gender: genderSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: termsSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const MEDICAL_LICENSE_NUMBER_MAX = 100;
export const LICENSE_AUTHORITY_MAX = 255;
export const YEARS_MIN = 0;
export const YEARS_MAX = 80;

export const medicalLicenseNumberSchema = z
  .string()
  .trim()
  .min(1, "Medical license number is required")
  .max(MEDICAL_LICENSE_NUMBER_MAX, "Medical license number is too long");

export const licenseAuthoritySchema = z
  .string()
  .trim()
  .min(1, "Issuing authority is required")
  .max(LICENSE_AUTHORITY_MAX, "Issuing authority is too long");

export const specialtySchema = z.string().trim().min(1, "Select a specialty");

export const yearsOfExperienceSchema = z
  .string()
  .trim()
  .min(1, "Years of experience is required")
  .refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= YEARS_MIN && parsed <= YEARS_MAX;
  }, `Enter a number between ${YEARS_MIN} and ${YEARS_MAX}`);

export const consentSchema = z.literal(true, {
  message: "You must consent to the verification checks",
});

export const onboardingSchema = z.object({
  medicalLicenseNumber: medicalLicenseNumberSchema,
  licenseIssuingAuthority: licenseAuthoritySchema,
  specialty: specialtySchema,
  yearsOfExperience: yearsOfExperienceSchema,
  consent: consentSchema,
});

/** Flatten a `ZodError` into `{ field: firstMessage }` for form-level rendering. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** First message a schema produced for one field, if any. */
export function errorFor(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}
