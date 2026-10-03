import { create } from "zustand";

export type LivenessResult = "idle" | "passed" | "failed";

export type HcpOnboardingFileKey =
  | "governmentIdFront"
  | "governmentIdBack"
  | "medicalLicense"
  | "qualification";

export type HcpOnboardingFiles = Record<HcpOnboardingFileKey, File | null>;

export type HcpOnboardingState = {
  files: HcpOnboardingFiles;
  livenessStatus: LivenessResult;

  setFile: (key: HcpOnboardingFileKey, file: File | null) => void;
  clearFile: (key: HcpOnboardingFileKey) => void;
  setLivenessStatus: (status: LivenessResult) => void;
  reset: () => void;
};

const INITIAL_FILES: HcpOnboardingFiles = {
  governmentIdFront: null,
  governmentIdBack: null,
  medicalLicense: null,
  qualification: null,
};

const INITIAL_STATE = {
  files: INITIAL_FILES,
  livenessStatus: "idle",
} as const satisfies Pick<HcpOnboardingState, "files" | "livenessStatus">;

export const useHcpOnboardingStore = create<HcpOnboardingState>((set) => ({
  ...INITIAL_STATE,

  setFile: (key, file) => set((state) => ({ files: { ...state.files, [key]: file } })),
  clearFile: (key) => set((state) => ({ files: { ...state.files, [key]: null } })),
  setLivenessStatus: (livenessStatus) => set({ livenessStatus }),
  reset: () => set({ ...INITIAL_STATE }),
}));
