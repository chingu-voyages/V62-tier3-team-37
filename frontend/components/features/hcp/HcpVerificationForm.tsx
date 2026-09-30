"use client";

import { useForm } from "@tanstack/react-form";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, BadgeCheck, Camera, CircleCheck, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHcpOnboardingMutation } from "@/hooks/use-hcp-onboarding-mutation";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { useHcpOnboardingStore } from "@/store/use-hcp-onboarding-store";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { LivenessCheck } from "./LivenessCheck";
import { SpecialtySelect } from "./SpecialtySelect";

type VerificationSectionProps = {
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  children: ReactNode;
};

function VerificationSection({
  title,
  description,
  icon: Icon,
  children,
}: VerificationSectionProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="type-h3 text-foreground">{title}</h2>
          <p className="mt-1 type-body text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const MEDICAL_LICENSE_NUMBER_MAX = 100;
const LICENSE_AUTHORITY_MAX = 255;
const YEARS_MIN = 0;
const YEARS_MAX = 80;

function medicalLicenseNumberError(value: string): string | undefined {
  if (value.length === 0) return "Medical license number is required";
  if (value.length > MEDICAL_LICENSE_NUMBER_MAX) {
    return `Medical license number must be ${MEDICAL_LICENSE_NUMBER_MAX} characters or fewer`;
  }
  return undefined;
}

function licenseAuthorityError(value: string): string | undefined {
  if (value.length === 0) return "Issuing authority is required";
  if (value.length > LICENSE_AUTHORITY_MAX) {
    return `Issuing authority must be ${LICENSE_AUTHORITY_MAX} characters or fewer`;
  }
  return undefined;
}

function yearsOfExperienceError(value: string): string | undefined {
  if (value.length === 0) return "Years of experience is required";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Enter a valid number";
  if (parsed < YEARS_MIN || parsed > YEARS_MAX) {
    return `Years of experience must be between ${YEARS_MIN} and ${YEARS_MAX}`;
  }
  return undefined;
}

function consentError(value: boolean): string | undefined {
  return value ? undefined : "You must accept to continue";
}

export function HcpVerificationForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const onboardingMutation = useHcpOnboardingMutation();

  const files = useHcpOnboardingStore((state) => state.files);
  const livenessStatus = useHcpOnboardingStore((state) => state.livenessStatus);
  const setFile = useHcpOnboardingStore((state) => state.setFile);
  const setLivenessStatus = useHcpOnboardingStore((state) => state.setLivenessStatus);
  const setField = useHcpOnboardingStore((state) => state.setField);
  const setConsent = useHcpOnboardingStore((state) => state.setConsent);
  const medicalLicenseNumber = useHcpOnboardingStore((state) => state.medicalLicenseNumber);
  const licenseIssuingAuthority = useHcpOnboardingStore((state) => state.licenseIssuingAuthority);
  const specialty = useHcpOnboardingStore((state) => state.specialty);
  const yearsOfExperience = useHcpOnboardingStore((state) => state.yearsOfExperience);
  const consent = useHcpOnboardingStore((state) => state.consent);

  const form = useForm({
    defaultValues: {
      medicalLicenseNumber,
      licenseIssuingAuthority,
      specialty,
      yearsOfExperience,
      consent,
    },
    onSubmit: ({ value }) => {
      const parsedYears = Number(value.yearsOfExperience);

      if (!files.governmentIdFront || !files.governmentIdBack) {
        setSubmitError("Please upload both the front and back of your government-issued ID.");
        return;
      }
      if (!files.medicalLicense || !files.qualification) {
        setSubmitError("Please upload your professional license and qualification documents.");
        return;
      }

      setSubmitError(null);
      setField("medicalLicenseNumber", value.medicalLicenseNumber);
      setField("licenseIssuingAuthority", value.licenseIssuingAuthority);
      setField("specialty", value.specialty);
      setField("yearsOfExperience", value.yearsOfExperience);
      setConsent(value.consent);

      if (livenessStatus !== "passed") {
        setSubmitError("Please complete the liveness check before submitting.");
        return;
      }

      onboardingMutation.mutate(
        {
          governmentIdFront: files.governmentIdFront,
          governmentIdBack: files.governmentIdBack,
          medicalLicense: files.medicalLicense,
          qualification: files.qualification,
          livenessStatus: "PASSED",
          medicalLicenseNumber: value.medicalLicenseNumber,
          licenseIssuingAuthority: value.licenseIssuingAuthority,
          specialty: value.specialty,
          yearsOfExperience: parsedYears,
          consent: value.consent,
        },
        {
          onSuccess: (response) => {
            setSubmittedAt(response.data.submitted_at);
            setSubmitted(true);
            toast.success("Your HCP verification application has been submitted successfully.", {
              position: "bottom-center",
            });
          },
          onError: handleSubmitError,
        },
      );
    },
  });

  function handleSubmitError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      setSubmitError("Your session has expired. Please sign in again.");
      return;
    }
    if (error instanceof ApiError && error.status === 403) {
      setSubmitError("Your account is not currently eligible to submit HCP verification.");
      return;
    }
    if (error instanceof ApiError && error.status === 422) {
      setSubmitError(
        "Please review the highlighted information and try again. If the issue persists, your application may already have been submitted.",
      );
      return;
    }
    setSubmitError(getApiErrorMessage(error));
  }

  if (submitted) {
    return (
      <AuthCard
        step={{ current: 3, total: 3, role: "HCP" }}
        eyebrow="Healthcare professional onboarding"
        title="Application submitted"
        subtitle="Your HCP verification is now under review."
      >
        <div className="flex flex-col gap-5">
          <Callout icon={CircleCheck} title="Under review">
            <p>
              Your verification application has been submitted successfully. Our team typically
              reviews applications within 1-2 business days.
            </p>
            {submittedAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(submittedAt).toLocaleString()}
              </p>
            ) : null}
          </Callout>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      step={{ current: 3, total: 3, role: "HCP" }}
      eyebrow="Healthcare professional onboarding"
      title="HCP verification"
      subtitle="Complete the steps below to verify your identity and professional credentials."
      footer={
        <span>
          Do you Have Already An Account?{" "}
          <Link
            href="/auth"
            className="rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/85 hover:decoration-primary"
          >
            Login
          </Link>
        </span>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-5 sm:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <VerificationSection
          title="Identity verification & KYC"
          icon={BadgeCheck}
          description={
            <>
              <span className="font-medium text-foreground">Government-issued ID</span>
              <span className="mt-1 block">
                KYC Level 1 - upload a valid passport, driver&apos;s license, or national ID.
              </span>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <DocumentUploadCard
              id="front-id-file"
              title="Front of ID"
              description="Upload a JPG, PNG, or PDF, max 10MB"
              file={files.governmentIdFront}
              onFileChange={(file) => setFile("governmentIdFront", file)}
            />
            <DocumentUploadCard
              id="back-id-file"
              title="Back of ID"
              description="Upload a JPG, PNG, or PDF, max 10MB"
              file={files.governmentIdBack}
              onFileChange={(file) => setFile("governmentIdBack", file)}
            />
          </div>
        </VerificationSection>

        <VerificationSection
          title="Liveness check"
          icon={Camera}
          description="KYC Level 1 · Quick selfie"
        >
          <LivenessCheck
            onResult={(result) => setLivenessStatus(result)}
            disabled={onboardingMutation.isPending}
          />
        </VerificationSection>

        <VerificationSection
          title="Professional credentials & KYC level 2"
          icon={ShieldCheck}
          description="Required for Healthcare Professionals only"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <DocumentUploadCard
              id="professional-license-file"
              title="Professional license"
              description="Upload your active medical license"
              file={files.medicalLicense}
              onFileChange={(file) => setFile("medicalLicense", file)}
            />
            <DocumentUploadCard
              id="certificate-qualification-file"
              title="Certificate / Qualification"
              description="Board certification or degree"
              file={files.qualification}
              onFileChange={(file) => setFile("qualification", file)}
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <form.Field
              name="medicalLicenseNumber"
              validators={{ onChange: ({ value }) => medicalLicenseNumberError(value) }}
            >
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="medical-license-number">Medical license number</Label>
                  <Input
                    id="medical-license-number"
                    placeholder="e.g. ML-2026-004521"
                    maxLength={MEDICAL_LICENSE_NUMBER_MAX}
                    value={field.state.value}
                    aria-invalid={
                      field.state.meta.isTouched && field.state.meta.errors[0] ? true : undefined
                    }
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                    <p className="text-xs leading-5 text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
            <form.Field
              name="licenseIssuingAuthority"
              validators={{ onChange: ({ value }) => licenseAuthorityError(value) }}
            >
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="issuing-authority">Issuing authority / board</Label>
                  <Input
                    id="issuing-authority"
                    placeholder="e.g. State Medical Board"
                    maxLength={LICENSE_AUTHORITY_MAX}
                    value={field.state.value}
                    aria-invalid={
                      field.state.meta.isTouched && field.state.meta.errors[0] ? true : undefined
                    }
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                    <p className="text-xs leading-5 text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
            <form.Field
              name="specialty"
              validators={{ onChange: ({ value }) => (value ? undefined : "Select a specialty") }}
            >
              {(field) => (
                <SpecialtySelect
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                />
              )}
            </form.Field>
            <form.Field
              name="yearsOfExperience"
              validators={{ onChange: ({ value }) => yearsOfExperienceError(value) }}
            >
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="years-of-experience">Years of experience</Label>
                  <Input
                    id="years-of-experience"
                    type="number"
                    min={YEARS_MIN}
                    max={YEARS_MAX}
                    placeholder="e.g. 8"
                    value={field.state.value}
                    aria-invalid={
                      field.state.meta.isTouched && field.state.meta.errors[0] ? true : undefined
                    }
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                    <p className="text-xs leading-5 text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          </div>
        </VerificationSection>

        <div className="rounded-2xl border border-border/80 bg-muted/50 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
                <Clock3 className="size-4.5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="type-h3 text-foreground">Verification status</h2>
                <p className="mt-1 max-w-2xl type-body text-muted-foreground">
                  Your license and qualification documents will be reviewed by our verification
                  team. This typically takes 1-2 business days before admin approval. Your
                  submission will be marked as pending until reviewed by our team.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-secondary/40 bg-accent px-2.5 py-1 type-step text-primary">
              Pending
            </span>
          </div>
        </div>

        <form.Field name="consent" validators={{ onChange: ({ value }) => consentError(value) }}>
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="hcp-verification-consent"
                  className="mt-0.5"
                  checked={field.state.value}
                  disabled={onboardingMutation.isPending}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                  aria-invalid={
                    field.state.meta.isTouched && field.state.meta.errors[0] ? true : undefined
                  }
                />
                <Label
                  htmlFor="hcp-verification-consent"
                  className="items-start font-normal type-helper text-muted-foreground"
                >
                  I confirm that the information and documents provided are accurate and I consent
                  to identity and credential verification checks in accordance with the{" "}
                  <span className="font-medium text-primary underline decoration-primary/35 underline-offset-4">
                    Privacy Policy
                  </span>
                  .
                </Label>
              </div>
              {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                <p className="pl-8 text-xs leading-5 text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        {submitError ? (
          <Callout tone="danger" role="alert">
            {submitError}
          </Callout>
        ) : null}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={onboardingMutation.isPending}
          >
            {onboardingMutation.isPending ? "Submitting…" : "Apply"}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
