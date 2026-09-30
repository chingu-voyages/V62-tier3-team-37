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
 * Context line shown under the "Create your account" title.
 *
 * Renders the current signup role plus a switch action that flips
 * between Patient and Healthcare Professional. Pure UI: the caller
 * owns the `SignupRole` state.
 */
export function SignupRoleSwitch({ role, onRoleChange }: SignupRoleSwitchProps) {
  const isPatient = role === "PATIENT";
  const nextRole: SignupRole = isPatient ? "HCP" : "PATIENT";

  return (
    <p className="type-body text-muted-foreground">
      Signing up as a{" "}
      <span className="font-medium text-foreground">{SIGNUP_ROLE_LABELS[role]}</span>.{" "}
      {isPatient ? "Not a patient?" : "Not a healthcare professional?"}{" "}
      <button
        type="button"
        onClick={() => onRoleChange(nextRole)}
        className="rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/85 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isPatient ? "Sign up as a Healthcare Professional" : "Sign up as a Patient"}
      </button>
    </p>
  );
}
