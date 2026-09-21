"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";

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
import { useRegisterMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const router = useRouter();
  const setSignupContext = useAuthStore((state) => state.setSignupContext);
  const registerMutation = useRegisterMutation();
  const isRegistering = registerMutation.isPending;

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
    if (!pendingSignup || submittingRef.current || isRegistering) return;
    submittingRef.current = true;
    setSubmitError(null);

    registerMutation.mutate(
      {
        role,
        payload: {
          first_name: pendingSignup.firstName,
          last_name: pendingSignup.lastName,
          email: pendingSignup.email,
          date_of_birth: pendingSignup.dateOfBirth,
          gender: pendingSignup.gender,
          password: pendingSignup.password,
          password_confirmation: pendingSignup.confirmPassword,
          terms: pendingSignup.terms,
        },
      },
      {
        onSuccess: () => {
          submittingRef.current = false;
          setSignupContext({
            email: pendingSignup.email,
            firstName: pendingSignup.firstName,
            lastName: pendingSignup.lastName,
            role,
          });
          setPendingSignup(null);
          router.push("/auth/otp");
        },
        onError: (error) => {
          submittingRef.current = false;
          setSubmitError(getApiErrorMessage(error));
          setPendingSignup(null);
        },
      },
    );
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

          <form.Field
            name="gender"
            validators={{
              onChange: ({ value }) => (value.length === 0 ? "Gender is required" : undefined),
            }}
          >
            {(field) => {
              const error = firstTouchedError(field.state.meta);
              return (
                <div className="space-y-1.5" aria-describedby={error ? "gender-error" : undefined}>
                  <span className="text-sm font-medium">Gender</span>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as RegisterValues["gender"])}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {GENDERS.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2.5",
                          error
                            ? "border-destructive has-data-[state=checked]:border-destructive"
                            : "has-data-[state=checked]:border-ring",
                        )}
                      >
                        <RadioGroupItem
                          id={`gender-${option.value}`}
                          value={option.value}
                          aria-invalid={error ? true : undefined}
                        />
                        <Label htmlFor={`gender-${option.value}`} className="text-sm font-medium">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {error ? (
                    <p id="gender-error" className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            }}
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
              onChange: ({ value }) => (value ? undefined : "Please accept the Terms of Service"),
            }}
          >
            {(field) => {
              const error = firstTouchedError(field.state.meta);
              return (
                <div className="space-y-1.5" aria-describedby={error ? "terms-error" : undefined}>
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="terms"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={error ? true : undefined}
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
                  {error ? (
                    <p id="terms-error" className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          {submitError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </p>
          ) : null}

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
            <Button onClick={handleConfirm} className="p-4 w-[60%]" disabled={isRegistering}>
              {isRegistering ? "Creating account…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
