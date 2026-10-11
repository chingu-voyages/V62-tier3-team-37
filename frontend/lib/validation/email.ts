/**
 * Email validation.
 *
 * The check itself lives in `rules.ts` so that a form rendering an email field
 * does not pull a schema library into its bundle. The `emailSchema` used by the
 * submit-time gate lives in `schemas.ts`.
 */

export { emailError } from "./rules";
