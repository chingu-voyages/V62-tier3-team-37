/**
 * Password policy.
 *
 * Mirrors the server rule in
 * `backend/app/Http/Requests/Auth/RegisterRequest.php`:
 *
 *     Password::min(8)->mixedCase()->numbers()->symbols()
 *
 * The frontend previously enforced only `min(8)`, so a password like
 * `password123` passed every client check and came back with a 422 after the
 * round trip. Keep the two in step — if you change one, change the other.
 *
 * The rules themselves live in `rules.ts`, which deliberately does not import a
 * schema library: a zod import here would pull the whole schema builder into
 * every route that renders a password field, and these run while the visitor is
 * typing.
 */

export {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_RULES,
  type PasswordStrengthLevel,
  passwordError,
  passwordStrengthLevel,
  unmetPasswordRules,
} from "./rules";
