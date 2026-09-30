import { create } from "zustand";
import type { SignupRole } from "@/components/features/auth/SignupRoleSwitch";

export type SignupContext = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: SignupRole | null;
};

type AuthStore = {
  signup: SignupContext;
  otpVerified: boolean;
  setSignupContext: (context: SignupContext) => void;
  setOtpVerified: (verified: boolean) => void;
  clearSignup: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  signup: { email: null, firstName: null, lastName: null, role: null },
  otpVerified: false,
  setSignupContext: (signup) => set({ signup, otpVerified: false }),
  setOtpVerified: (otpVerified) => set({ otpVerified }),
  clearSignup: () =>
    set({
      signup: { email: null, firstName: null, lastName: null, role: null },
      otpVerified: false,
    }),
}));
