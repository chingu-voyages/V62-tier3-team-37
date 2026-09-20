export type SignupRole = "PATIENT" | "HCP";

export const SIGNUP_ROLE_LABELS: Record<SignupRole, string> = {
  PATIENT: "Patient",
  HCP: "Healthcare Professional",
};

type SignupRoleSwitchProps = {
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
};

/**
 * Header line shown under the "Create your account" title.
 *
 * Renders the current signup role plus a switch action that flips
 * between Patient and Healthcare Professional. Pure UI: the caller
 * owns the `SignupRole` state.
 */
export function SignupRoleSwitch({ role, onRoleChange }: SignupRoleSwitchProps) {
  const isPatient = role === "PATIENT";
  const nextRole: SignupRole = isPatient ? "HCP" : "PATIENT";

  return (
    <>
      Signing up as a{" "}
      <span className="font-semibold text-foreground">{SIGNUP_ROLE_LABELS[role]}</span>.{" "}
      {isPatient ? "Not a patient?" : "Not a professional?"}{" "}
      <button
        type="button"
        onClick={() => onRoleChange(nextRole)}
        className="cursor-pointer text-blue-400 rounded-sm font-medium  underline-offset-4 outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:underline"
      >
        {isPatient ? "Sign up as a Healthcare Professional" : "Sign up as a Patient"}
      </button>
    </>
  );
}
