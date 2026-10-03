import type { SignupRole } from "@/types/auth";

export const SIGNUP_JOURNEY_STEPS: Record<SignupRole, number> = {
  PATIENT: 2,
  HCP: 3,
};

export function signupJourneySteps(role: SignupRole | null | undefined): number {
  return role ? SIGNUP_JOURNEY_STEPS[role] : SIGNUP_JOURNEY_STEPS.PATIENT;
}
