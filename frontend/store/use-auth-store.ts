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
  otpVerified: boolean;
  setSignupContext: (context: SignupContext) => void;
  setOtpVerified: (verified: boolean) => void;
  clearSignup: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  signup: EMPTY_SIGNUP,
  otpVerified: false,
  setSignupContext: (signup) => set({ signup, otpVerified: false }),
  setOtpVerified: (otpVerified) => set({ otpVerified }),
  clearSignup: () =>
    set({
      signup: EMPTY_SIGNUP,
      otpVerified: false,
    }),
}));
