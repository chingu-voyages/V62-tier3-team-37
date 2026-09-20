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
  setSignupContext: (context: SignupContext) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  signup: { email: null, firstName: null, lastName: null, role: null },
  setSignupContext: (signup) => set({ signup }),
}));
