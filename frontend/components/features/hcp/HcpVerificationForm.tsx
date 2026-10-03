"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, BadgeCheck, Camera, CircleCheck, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldMessage } from "@/components/ui/field-message";
import { inlineLinkClassName } from "@/components/ui/inline-link";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/ui/text-field";
import { useHcpOnboardingMutation } from "@/hooks/use-hcp-onboarding-mutation";
import { ApiError, getApiErrorMessage } from "@/lib/api/client";
import { SIGNUP_JOURNEY_STEPS } from "@/lib/auth/journey";
import { ROUTES } from "@/lib/constants/routes";
import { formatDateTime } from "@/lib/format";
import { firstTouchedError } from "@/lib/validation/field-error";
import {
  consentSchema,
  errorFor,
  fieldErrorsFrom,
  LICENSE_AUTHORITY_MAX,
  licenseAuthoritySchema,
  MEDICAL_LICENSE_NUMBER_MAX,
  medicalLicenseNumberSchema,
  onboardingSchema,
  specialtySchema,
  YEARS_MAX,
  YEARS_MIN,
  yearsOfExperienceSchema,
} from "@/lib/validation/schemas";
import { useHcpOnboardingStore } from "@/store/use-hcp-onboarding-store";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { LivenessCheck } from "./LivenessCheck";
import { SpecialtySelect } from "./SpecialtySelect";

function VerificationSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: ReactNode;
  icon: typeof ShieldCheck;
  children: ReactNode;
}) {
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

export function HcpVerificationForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const onboardingMutation = useHcpOnboardingMutation();
  const { files, livenessStatus } = useHcpOnboardingStore(
    useShallow((state) => ({ files: state.files, livenessStatus: state.livenessStatus })),
  );
  const setFile = useHcpOnboardingStore((state) => state.setFile);
  const setLivenessStatus = useHcpOnboardingStore((state) => state.setLivenessStatus);
  const reset = useHcpOnboardingStore((state) => state.reset);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isSubmitting = onboardingMutation.isPending;

  const form = useForm({
    defaultValues: {
      medicalLicenseNumber: "",
      licenseIssuingAuthority: "",
      specialty: "",
      yearsOfExperience: "",
      consent: false,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = onboardingSchema.safeParse(value);
        if (result.success) return undefined;
        const fields = fieldErrorsFrom(result.error);
        const first = Object.values(fields)[0];
        return first;
      },
    },
    onSubmit: ({ value }) => {
      if (!files.governmentIdFront || !files.governmentIdBack) {
        setSubmitError("Please upload both the front and back of your government-issued ID.");
        return;
      }
      if (!files.medicalLicense || !files.qualification) {
        setSubmitError("Please upload your professional license and qualification documents.");
        return;
      }
      if (livenessStatus !== "passed") {
        setSubmitError("Please complete the liveness check before submitting.");
        return;
      }

      setSubmitError(null);

      onboardingMutation.mutate(
        {
          governmentIdFront: files.governmentIdFront,
          governmentIdBack: files.governmentIdBack,
          medicalLicense: files.medicalLicense,
          qualification: files.qualification,
          livenessStatus: "PASSED",
          medicalLicenseNumber: value.medicalLicenseNumber.trim(),
          licenseIssuingAuthority: value.licenseIssuingAuthority.trim(),
          specialty: value.specialty,
          yearsOfExperience: Number(value.yearsOfExperience),
          consent: value.consent,
        },
        {
          onSuccess: (response) => {
            if (!mounted.current) return;
            setSubmittedAt(response.data.submitted_at);
            // Release the four retained File handles.
            reset();
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
    if (!mounted.current) return;

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

  const submitted = submittedAt !== null;

  if (submitted) {
    return (
      <AuthCard
        step={{ current: 3, total: SIGNUP_JOURNEY_STEPS.HCP }}
        eyebrow="Healthcare professional onboarding"
        title="Application submitted"
        subtitle="Your HCP verification is now under review."
      >
        <Callout icon={CircleCheck} title="Under review">
          <p>
            Your verification application has been submitted successfully. Our team typically
            reviews applications within 1-2 business days.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatDateTime(submittedAt)}
          </p>
        </Callout>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      step={{ current: 3, total: SIGNUP_JOURNEY_STEPS.HCP }}
      eyebrow="Healthcare professional onboarding"
      title="HCP verification"
      subtitle="Complete the steps below to verify your identity and professional credentials."
      footer={
        <span>
          Already have an account?{" "}
          <Link href={ROUTES.auth} className={inlineLinkClassName}>
            Log in
          </Link>
        </span>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-5 sm:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
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
          <LivenessCheck onResult={setLivenessStatus} disabled={isSubmitting} />
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
              validators={{ onChange: ({ value }) => errorFor(medicalLicenseNumberSchema, value) }}
            >
              {(field) => (
                <TextField
                  id="medical-license-number"
                  name="medicalLicenseNumber"
                  label="Medical license number"
                  placeholder="e.g. ML-2026-004521"
                  required
                  maxLength={MEDICAL_LICENSE_NUMBER_MAX}
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field
              name="licenseIssuingAuthority"
              validators={{ onChange: ({ value }) => errorFor(licenseAuthoritySchema, value) }}
            >
              {(field) => (
                <TextField
                  id="issuing-authority"
                  name="licenseIssuingAuthority"
                  label="Issuing authority / board"
                  placeholder="e.g. State Medical Board"
                  required
                  maxLength={LICENSE_AUTHORITY_MAX}
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field
              name="specialty"
              validators={{ onChange: ({ value }) => errorFor(specialtySchema, value) }}
            >
              {(field) => (
                <SpecialtySelect
                  // The validator ran but its message was never rendered, so an
                  // empty specialty silently passed and posted "".
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>

            <form.Field
              name="yearsOfExperience"
              validators={{ onChange: ({ value }) => errorFor(yearsOfExperienceSchema, value) }}
            >
              {(field) => (
                <TextField
                  id="years-of-experience"
                  name="yearsOfExperience"
                  label="Years of experience"
                  type="number"
                  required
                  min={YEARS_MIN}
                  max={YEARS_MAX}
                  placeholder="e.g. 8"
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
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

        <form.Field
          name="consent"
          validators={{ onChange: ({ value }) => errorFor(consentSchema, value) }}
        >
          {(field) => {
            const error = firstTouchedError(field.state.meta);
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="hcp-verification-consent"
                    className="mt-0.5"
                    checked={field.state.value}
                    disabled={isSubmitting}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "consent-error" : undefined}
                  />
                  <Label
                    htmlFor="hcp-verification-consent"
                    className="items-start font-normal type-helper text-muted-foreground"
                  >
                    I confirm that the information and documents provided are accurate and I consent
                    to identity and credential verification checks in accordance with the{" "}
                    <Link
                      href={ROUTES.privacy}
                      className="font-medium text-primary underline decoration-primary/35 underline-offset-4"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
                <FieldMessage id={error ? "consent-error" : undefined} className="pl-8">
                  {error}
                </FieldMessage>
              </div>
            );
          }}
        </form.Field>

        {submitError ? <Callout tone="danger">{submitError}</Callout> : null}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Apply"}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
