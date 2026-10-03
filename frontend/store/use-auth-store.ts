import { create } from "zustand";
import type { SignupContext } from "@/types/auth";

const EMPTY_SIGNUP: SignupContext = Object.freeze({
  email: null,
  firstName: null,
  lastName: null,
  role: null,
});

type AuthStore = {
  signup: SignupContext;

  setSignupContext: (context: Partial<SignupContext>) => void;
  clearSignup: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  signup: EMPTY_SIGNUP,
  setSignupContext: (context) => set((state) => ({ signup: { ...state.signup, ...context } })),
  clearSignup: () => set({ signup: EMPTY_SIGNUP }),
}));

export type { SignupContext };
