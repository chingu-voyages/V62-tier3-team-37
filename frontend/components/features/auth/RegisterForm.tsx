"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AuthCard } from "./AuthCard";
import { firstTouchedError } from "./field-error";
import { PasswordField } from "./PasswordField";
import { PasswordStrength } from "./PasswordStrength";
import { SIGNUP_ROLE_LABELS, type SignupRole, SignupRoleSwitch } from "./SignupRoleSwitch";
import { TextField } from "./TextField";

enum Gender {
  Male = "male",
  Female = "female",
}

type RegisterValues = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredError(value: string, message: string): string | undefined {
  return value.length === 0 ? message : undefined;
}

function emailError(value: string): string | undefined {
  if (value.length === 0) return "Email address is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
  return undefined;
}

function dateError(value: string): string | undefined {
  return value.length === 0 ? "Date of birth is required" : undefined;
}

function passwordError(value: string): string | undefined {
  if (value.length === 0) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return undefined;
}

const GENDERS: { value: RegisterValues["gender"]; label: string }[] = [
  { value: Gender.Male, label: "Male" },
  { value: Gender.Female, label: "Female" },
];

type RegisterFormProps = {
  tabs?: ReactNode;
};

export function RegisterForm({ tabs }: RegisterFormProps) {
  const [role, setRole] = useState<SignupRole>("PATIENT");
  const [pendingSignup, setPendingSignup] = useState<RegisterValues | null>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    onSubmit: ({ value }) => {
      setPendingSignup(value as RegisterValues);
    },
  });

  function handleConfirm() {
    if (!pendingSignup) return;
    // TEMPORARY development behavior — actual API integration lands in a later
    // step: PATIENT -> POST /register/patient, HCP -> POST /register/hcp.
    console.info("Register confirmation (no API call yet)", { role, ...pendingSignup });
    setPendingSignup(null);
  }

  return (
    <>
      <AuthCard
        title="Create your account"
        subtitle={<SignupRoleSwitch role={role} onRoleChange={setRole} />}
        tabs={tabs}
        info="Are you a Healthcare Professional? You'll verify with Email OTP and upload your professional credentials in a later step."
      >
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="firstName"
              validators={{
                onChange: ({ value }) => requiredError(value, "First name is required"),
              }}
            >
              {(field) => (
                <TextField
                  id="firstName"
                  label="First name"
                  autoComplete="given-name"
                  placeholder="First Name"
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field
              name="lastName"
              validators={{
                onChange: ({ value }) => requiredError(value, "Last name is required"),
              }}
            >
              {(field) => (
                <TextField
                  id="lastName"
                  label="Last name"
                  autoComplete="family-name"
                  placeholder="Family Name"
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="email" validators={{ onChange: ({ value }) => emailError(value) }}>
            {(field) => (
              <TextField
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={field.state.value}
                error={firstTouchedError(field.state.meta)}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>

          <form.Field name="dateOfBirth" validators={{ onChange: ({ value }) => dateError(value) }}>
            {(field) => (
              <TextField
                id="dateOfBirth"
                label="Date of birth"
                type="date"
                autoComplete="bday"
                value={field.state.value}
                error={firstTouchedError(field.state.meta)}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Gender</span>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as RegisterValues["gender"])}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {GENDERS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 has-data-[state=checked]:border-ring"
                    >
                      <RadioGroupItem id={`gender-${option.value}`} value={option.value} />
                      <Label htmlFor={`gender-${option.value}`} className="text-sm font-medium">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => passwordError(value) }}
          >
            {(field) => (
              <div className="space-y-2">
                <PasswordField
                  id="password"
                  label="Password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                />
                <PasswordStrength value={field.state.value} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value, fieldApi }) => {
                const password = fieldApi.form.state.values.password;
                if (value.length === 0) return "Confirm your password";
                if (value !== password) return "Passwords do not match";
                return undefined;
              },
              onChangeListenTo: ["password"],
            }}
          >
            {(field) => (
              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={field.state.value}
                error={firstTouchedError(field.state.meta)}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>

          <form.Field
            name="terms"
            validators={{
              onChange: ({ value }) => (value ? undefined : "this should be a required field"),
            }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="terms"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                    aria-invalid={firstTouchedError(field.state.meta) ? true : undefined}
                  />
                  <Label
                    htmlFor="terms"
                    className="pt-0.5 text-sm font-normal leading-5 text-muted-foreground"
                  >
                    I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
              </div>
            )}
          </form.Field>

          <Button type="submit" size="lg" className="mt-1 h-11 w-full">
            Create account
          </Button>
        </form>
      </AuthCard>

      <Dialog
        open={pendingSignup !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSignup(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign up as a
              <span className="ml-1 text-blue-400 mr-1">{SIGNUP_ROLE_LABELS[role]}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="p-4 w-[40%]">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleConfirm} className="p-4 w-[60%]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
