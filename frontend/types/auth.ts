/**
 * Auth domain types.
 *
 * These live in `types/` rather than in a component so that `lib/`, `store/`
 * and `hooks/` can depend on them without importing a `.tsx` file.
 */

/**
 * The two account types a visitor can sign up as.
 *
 * The array is the source of truth and the type is derived from it, so a new role
 * cannot be added to one and forgotten in the other.
 *
 * Deliberately pure — no `null`, no `0`, no `"UNKNOWN"`. "Not chosen yet" is a
 * property of the *flow*, not of the role, so it is modelled at the boundary as
 * `SignupRole | null` (see `SignupContext`) rather than as a third member here.
 *
 * That distinction matters: adding a sentinel member makes every exhaustive
 * `Record<SignupRole, T>` in the app demand a case for it. `REGISTER_ENDPOINTS` in
 * `@/lib/api/auth-client` is such a map, and a `0` key there would type-check a
 * `registerUser(0, …)` call straight into a network request.
 */
export const SIGNUP_ROLES = ["PATIENT", "HCP"] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export function isSignupRole(value: string): value is SignupRole {
  return (SIGNUP_ROLES as readonly string[]).includes(value);
}

export const SIGNUP_ROLE_LABELS: Record<SignupRole, string> = {
  PATIENT: "Patient",
  HCP: "Healthcare Professional",
};

export type Gender = "male" | "female";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
};

/**
 * The user shape returned by `GET /api/user`.
 *
 * Mirrors what Laravel serialises, which includes `first_name` / `last_name`
 * separately (there is no combined `name` on the API). Everything is nullable
 * because a partial profile is legitimate.
 */
export type AuthUser = {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  email_verified_at?: string | null;
  profile_photo_path?: string | null;
} | null;

/** In-progress signup state carried between the register and OTP screens. */
export type SignupContext = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: SignupRole | null;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: Gender;
  password: string;
  password_confirmation: string;
  terms: boolean;
};
