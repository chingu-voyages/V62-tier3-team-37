import { create } from "zustand";

export type LivenessResult = "idle" | "passed" | "failed";

export type HcpOnboardingFiles = {
  governmentIdFront: File | null;
  governmentIdBack: File | null;
  medicalLicense: File | null;
  qualification: File | null;
};

export type HcpOnboardingState = {
  files: HcpOnboardingFiles;
  livenessStatus: LivenessResult;
  medicalLicenseNumber: string;
  licenseIssuingAuthority: string;
  specialty: string;
  yearsOfExperience: string;
  consent: boolean;

  setFile: (key: keyof HcpOnboardingFiles, file: File | null) => void;
  clearFile: (key: keyof HcpOnboardingFiles) => void;
  setLivenessStatus: (status: LivenessResult) => void;
  setField: (
    field: "medicalLicenseNumber" | "licenseIssuingAuthority" | "specialty" | "yearsOfExperience",
    value: string,
  ) => void;
  setConsent: (consent: boolean) => void;
  reset: () => void;
};

const INITIAL_FILES: HcpOnboardingFiles = {
  governmentIdFront: null,
  governmentIdBack: null,
  medicalLicense: null,
  qualification: null,
};

export const useHcpOnboardingStore = create<HcpOnboardingState>((set) => ({
  files: INITIAL_FILES,
  livenessStatus: "idle",
  medicalLicenseNumber: "",
  licenseIssuingAuthority: "",
  specialty: "",
  yearsOfExperience: "",
  consent: false,

  setFile: (key, file) => set((state) => ({ files: { ...state.files, [key]: file } })),
  clearFile: (key) => set((state) => ({ files: { ...state.files, [key]: null } })),
  setLivenessStatus: (livenessStatus) => set({ livenessStatus }),
  setField: (field, value) => set({ [field]: value } as Pick<HcpOnboardingState, typeof field>),
  setConsent: (consent) => set({ consent }),
  reset: () =>
    set({
      files: INITIAL_FILES,
      livenessStatus: "idle",
      medicalLicenseNumber: "",
      licenseIssuingAuthority: "",
      specialty: "",
      yearsOfExperience: "",
      consent: false,
    }),
}));
