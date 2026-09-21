import { create } from "zustand";
import type { SignupRole } from "@/components/features/auth/SignupRoleSwitch";

export type SignupContext = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: SignupRole | null;
};

const EMPTY_SIGNUP: SignupContext = {
  email: null,
  firstName: null,
  lastName: null,
  role: null,
};

type AuthStore = {
  signup: SignupContext;
  setSignupContext: (context: SignupContext) => void;
  resetSignupContext: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  signup: EMPTY_SIGNUP,
  setSignupContext: (signup) => set({ signup }),
  resetSignupContext: () => set({ signup: EMPTY_SIGNUP }),
}));
