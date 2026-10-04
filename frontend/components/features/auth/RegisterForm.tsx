"use client";

import { useForm } from "@tanstack/react-form";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PasswordPolicyHint } from "@/components/features/auth/PasswordPolicyHint";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
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
import { FieldMessage } from "@/components/ui/field-message";
import { inlineLinkClassName } from "@/components/ui/inline-link";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { useRegisterMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { signupJourneySteps } from "@/lib/auth/journey";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { emailError } from "@/lib/validation/email";
import { firstTouchedError } from "@/lib/validation/field-error";
import { passwordError } from "@/lib/validation/password";
import {
  dateOfBirthSchema,
  errorFor,
  fieldErrorsFrom,
  genderSchema,
  registerSchema,
  termsSchema,
} from "@/lib/validation/schemas";
import { useAuthStore } from "@/store/use-auth-store";
import { GENDER_LABELS, type Gender, SIGNUP_ROLE_LABELS, type SignupRole } from "@/types/auth";
import { AuthCard } from "./AuthCard";
import { PasswordStrength } from "./PasswordStrength";
import { SignupRoleSwitch } from "./SignupRoleSwitch";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: GENDER_LABELS.male },
  { value: "female", label: GENDER_LABELS.female },
];

const MIN_DATE_OF_BIRTH = "1900-01-01";
const MAX_DATE_OF_BIRTH = new Date().toISOString().slice(0, 10);

type RegisterFormProps = {
  tabs?: ReactNode;
  initialRole?: SignupRole;
};

export function RegisterForm({ tabs, initialRole = "PATIENT" }: RegisterFormProps) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const setSignupContext = useAuthStore((state) => state.setSignupContext);
  const registerMutation = useRegisterMutation();
  const isRegistering = registerMutation.isPending;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      gender: "" as Gender | "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    validators: {
      // Submit-time gate. The form previously declared only onChange validators,
      // so a required field left untouched could be posted empty and rejected
      // solely by the backend's 422.
      onSubmit: ({ value }) => {
        const result = registerSchema.safeParse(value);
        if (result.success) return undefined;
        const fields = fieldErrorsFrom(result.error);
        // Per-field validators already render the individual messages; this
        // submit-time gate only needs to stop the submit, and surfaces the one
        // error no field owns (the password confirmation mismatch).
        const fieldKeys = Object.keys(fields).filter((key) => key !== "confirmPassword");
        if (fieldKeys.length > 0) return undefined;
        return fields.confirmPassword;
      },
    },
    onSubmit: () => {
      // Only reached once every field validates. The confirm dialog reads the
      // live form state, so no snapshot copy of the values is needed.
      setSubmitError(null);
      setServerFieldErrors({});
      setConfirming(true);
    },
  });

  function handleConfirm() {
    if (isRegistering) return;
    setSubmitError(null);

    const { password, ...rest } = form.state.values;

    registerMutation.mutate(
      {
        role,
        payload: {
          first_name: rest.firstName.trim(),
          last_name: rest.lastName.trim(),
          email: rest.email.trim(),
          date_of_birth: rest.dateOfBirth,
          gender: rest.gender as Gender,
          password,
          password_confirmation: password,
          terms: rest.terms,
        },
      },
      {
        onSuccess: () => {
          if (!mounted.current) return;
          setSignupContext({
            email: rest.email.trim(),
            firstName: rest.firstName.trim(),
            lastName: rest.lastName.trim(),
            role,
          });
          setConfirming(false);
          router.push(ROUTES.otp);
        },
        onError: (error) => {
          if (!mounted.current) return;
          setServerFieldErrors({
            email: getApiFieldError(error, "email") ?? "",
            password: getApiFieldError(error, "password") ?? "",
          });
          setSubmitError(getApiErrorMessage(error));
          setConfirming(false);
        },
      },
    );
  }

  return (
    <>
      <AuthCard
        step={{ current: 1, total: signupJourneySteps(role) }}
        title="Create your account"
        subtitle={<SignupRoleSwitch role={role} onRoleChange={setRole} />}
        tabs={tabs}
      >
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="firstName">
              {(field) => (
                <TextField
                  id="firstName"
                  name="firstName"
                  label="First name"
                  autoComplete="given-name"
                  placeholder="First Name"
                  required
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field name="lastName">
              {(field) => (
                <TextField
                  id="lastName"
                  name="lastName"
                  label="Last name"
                  autoComplete="family-name"
                  placeholder="Family Name"
                  required
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="email" validators={{ onChange: ({ value }) => emailError(value) }}>
            {(field) => (
              <TextField
                id="email"
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={field.state.value}
                error={serverFieldErrors.email || firstTouchedError(field.state.meta)}
                onChange={(value) => {
                  field.handleChange(value);
                  if (submitError) setSubmitError(null);
                }}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <form.Field
              name="dateOfBirth"
              validators={{ onChange: ({ value }) => errorFor(dateOfBirthSchema, value) }}
            >
              {(field) => (
                <TextField
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of birth"
                  type="date"
                  autoComplete="bday"
                  required
                  min={MIN_DATE_OF_BIRTH}
                  max={MAX_DATE_OF_BIRTH}
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>

            <form.Field
              name="gender"
              validators={{ onChange: ({ value }) => errorFor(genderSchema, value) }}
            >
              {(field) => {
                const error = firstTouchedError(field.state.meta);
                return (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span id="gender-label" className="type-label text-foreground">
                      Gender
                    </span>
                    {/* aria-describedby belongs on the control itself, not on a
                        wrapper div — on a wrapper it is never announced. */}
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as Gender)}
                      aria-labelledby="gender-label"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "gender-error" : undefined}
                      className="sm:grid-cols-2"
                    >
                      {GENDERS.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors",
                            "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent",
                            error ? "border-destructive" : "border-input hover:border-primary/40",
                          )}
                        >
                          <RadioGroupItem
                            id={`gender-${option.value}`}
                            value={option.value}
                            aria-invalid={error ? true : undefined}
                          />
                          <Label
                            htmlFor={`gender-${option.value}`}
                            className="cursor-pointer type-label"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <FieldMessage id="gender-error">{error}</FieldMessage>
                  </div>
                );
              }}
            </form.Field>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <form.Field
              name="password"
              validators={{ onChange: ({ value }) => passwordError(value) }}
            >
              {(field) => (
                <div className="flex min-w-0 flex-col gap-2">
                  <PasswordField
                    id="password"
                    name="password"
                    label="Password"
                    autoComplete="new-password"
                    placeholder="Mixed case, a number and a symbol"
                    required
                    value={field.state.value}
                    error={firstTouchedError(field.state.meta)}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                  />
                  <PasswordStrength value={field.state.value} />
                  <PasswordPolicyHint value={field.state.value} />
                </div>
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  if (value.length === 0) return "Confirm your password";
                  if (value !== fieldApi.form.state.values.password)
                    return "Passwords do not match";
                  return undefined;
                },
                onChangeListenTo: ["password"],
              }}
            >
              {(field) => (
                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  required
                  value={field.state.value}
                  error={firstTouchedError(field.state.meta)}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </div>

          <Callout icon={MailCheck} title="Verify your email to continue">
            Are you a Healthcare Professional? You&apos;ll verify with Email OTP and upload your
            professional credentials in a later step.
          </Callout>

          <form.Field
            name="terms"
            validators={{ onChange: ({ value }) => errorFor(termsSchema, value) }}
          >
            {(field) => {
              const error = firstTouchedError(field.state.meta);
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "terms-error" : undefined}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="terms"
                      className="cursor-pointer items-start font-normal type-helper text-muted-foreground"
                    >
                      <span>
                        I have read and agree to the{" "}
                        <a href={ROUTES.terms} className={inlineLinkClassName}>
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href={ROUTES.privacy} className={inlineLinkClassName}>
                          Privacy Policy
                        </a>
                        .
                      </span>
                    </Label>
                  </div>
                  <FieldMessage id="terms-error" className="pl-8">
                    {error}
                  </FieldMessage>
                </div>
              );
            }}
          </form.Field>

          {submitError ? (
            <Callout tone="danger" role="alert">
              {submitError}
            </Callout>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button type="submit" size="xl" className="w-full sm:w-auto sm:min-w-56">
              Create account
            </Button>
          </div>
        </form>
      </AuthCard>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open && !isRegistering) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign up as a{" "}
              <span className="font-medium text-primary">{SIGNUP_ROLE_LABELS[role]}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirm}
              size="lg"
              className="w-full sm:w-auto"
              disabled={isRegistering}
            >
              {isRegistering ? "Creating account…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
