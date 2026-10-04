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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { useRegisterMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { signupJourneySteps } from "@/lib/auth/journey";
import { ROUTES } from "@/lib/constants/routes";
import { emailError } from "@/lib/validation/email";
import { firstTouchedError } from "@/lib/validation/field-error";
import { passwordError } from "@/lib/validation/password";
import {
  dateOfBirthSchema,
  errorFor,
  fieldErrorsFrom,
  firstNameSchema,
  genderSchema,
  lastNameSchema,
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
  role: SignupRole;
  onRoleChange: (role: SignupRole) => void;
  onLogIn?: () => void;
};

function revealFirstInvalid(form: HTMLFormElement) {
  const invalid = form.querySelector<HTMLElement>("[aria-invalid='true']");
  invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function RegisterForm({ tabs, role, onRoleChange, onLogIn }: RegisterFormProps) {
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
        step={{ current: 1, total: signupJourneySteps(role), detail: "Your details" }}
        title={role === "HCP" ? "Sign up as a clinician" : "Sign up as a patient"}
        subtitle={<SignupRoleSwitch role={role} onRoleChange={onRoleChange} />}
        tabs={tabs}
      >
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            void form.handleSubmit().then(() => {
              requestAnimationFrame(() => revealFirstInvalid(formElement));
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="firstName"
              validators={{ onChange: ({ value }) => errorFor(firstNameSchema, value) }}
            >
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

            <form.Field
              name="lastName"
              validators={{ onChange: ({ value }) => errorFor(lastNameSchema, value) }}
            >
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

          <div className="grid items-start gap-x-4 gap-y-1.5 sm:grid-cols-2">
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
                    <Label htmlFor="gender">
                      Gender
                      <span aria-hidden="true" className="text-destructive">
                        {" "}
                        *
                      </span>
                      <span className="sr-only"> (required)</span>
                    </Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as Gender)}
                    >
                      <SelectTrigger
                        id="gender"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? "gender-error" : undefined}
                        onBlur={field.handleBlur}
                        className="h-11 w-full bg-card type-body"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldMessage id="gender-error">{error}</FieldMessage>
                  </div>
                );
              }}
            </form.Field>

            <p className="type-helper text-muted-foreground sm:col-span-2">
              Date of birth and gender stay on your account record.
            </p>
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
                    placeholder="Create a password"
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

          <Callout
            icon={MailCheck}
            title={role === "HCP" ? "Credentials come later" : "A code comes next"}
          >
            {role === "HCP"
              ? "You'll confirm this email with a code, then upload your professional credentials."
              : "We'll email a 6-digit code to confirm this address. After that, your visits and the clinician search are on your home page."}
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

          <div className="flex flex-col gap-3">
            <Button type="submit" size="xl" className="w-full">
              Next
            </Button>
            {onLogIn ? (
              <p className="text-center type-body text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={onLogIn} className={inlineLinkClassName}>
                  Log in
                </button>
              </p>
            ) : null}
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
            <DialogTitle>Check these details</DialogTitle>
            <DialogDescription>
              {role === "HCP"
                ? "We'll create the clinician account and email a code to this address. Credentials come after the code."
                : "We'll create your patient account and email a code to this address."}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid gap-3">
            <div>
              <dt className="type-helper text-muted-foreground">Name</dt>
              <dd className="type-body text-foreground">
                {form.state.values.firstName.trim()} {form.state.values.lastName.trim()}
              </dd>
            </div>
            <div>
              <dt className="type-helper text-muted-foreground">Email</dt>
              <dd className="type-body text-foreground">{form.state.values.email.trim()}</dd>
            </div>
            <div>
              <dt className="type-helper text-muted-foreground">Account</dt>
              <dd className="type-body text-foreground">{SIGNUP_ROLE_LABELS[role]}</dd>
            </div>
          </dl>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Edit details
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
