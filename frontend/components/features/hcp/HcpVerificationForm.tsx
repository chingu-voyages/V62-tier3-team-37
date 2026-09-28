import type { LucideIcon } from "lucide-react";
import { ArrowLeft, BadgeCheck, Camera, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AuthCard } from "@/components/features/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <section className="rounded-md border bg-background p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-h3 text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function HcpVerificationForm() {
  return (
    <AuthCard
      eyebrow="Healthcare professional onboarding"
      title="HCP verification"
      subtitle="Complete the steps below to verify your identity and professional credentials."
      footer={
        <span>
          Do you Have Already An Account?{" "}
          <Link
            href="/auth"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            Login
          </Link>
        </span>
      }
    >
      <div className="space-y-5 sm:space-y-6">
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
            />
            <DocumentUploadCard
              id="back-id-file"
              title="Back of ID"
              description="Upload a JPG, PNG, or PDF, max 10MB"
            />
          </div>
        </VerificationSection>

        <VerificationSection
          title="Liveness check"
          icon={Camera}
          description="KYC Level 1 · Quick selfie"
        >
          <LivenessCheck />
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
            />
            <DocumentUploadCard
              id="certificate-qualification-file"
              title="Certificate / Qualification"
              description="Board certification or degree"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="medical-license-number">Medical license number</Label>
              <Input id="medical-license-number" placeholder="e.g. ML-2026-004521" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issuing-authority">Issuing authority / board</Label>
              <Input id="issuing-authority" placeholder="e.g. State Medical Board" />
            </div>
            <SpecialtySelect />
            <div className="space-y-1.5">
              <Label htmlFor="years-of-experience">Years of experience</Label>
              <Input id="years-of-experience" type="number" placeholder="e.g. 8" />
            </div>
          </div>
        </VerificationSection>

        <div className="rounded-md border bg-muted/40 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
                <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-h3 text-foreground">Verification status</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your license and qualification documents will be reviewed by our verification
                  team. This typically takes 1-2 business days before admin approval. Your
                  submission will be marked as pending until reviewed by our team.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              Pending
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 border-t pt-5">
          <Checkbox id="hcp-verification-consent" className="mt-0.5" />
          <Label
            htmlFor="hcp-verification-consent"
            className="items-start text-sm font-normal leading-5 text-muted-foreground"
          >
            I confirm that the information and documents provided are accurate and I consent to
            identity and credential verification checks in accordance with the{" "}
            <span className="font-medium text-foreground underline underline-offset-4">
              Privacy Policy
            </span>
            .
          </Label>
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button type="button" className="w-full sm:w-auto">
            Apply
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
