"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants/routes";
import { emailSchema } from "@/lib/validation/email";
import { firstTouchedError } from "@/lib/validation/field-error";
import { errorFor, loginSchema } from "@/lib/validation/schemas";

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const loginMutation = useLoginMutation();
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      // Submit-time gate. Without this the form relied entirely on onChange
      // validators firing, and a field never touched could post empty.
      onSubmit: ({ value }) => errorFor(loginSchema, value),
    },
    onSubmit: ({ value }) => {
      setSubmitError(null);
      setServerFieldErrors({});

      loginMutation.mutate(
        { email: value.email.trim(), password: value.password, remember: false },
        {
          onSuccess: () => {
            if (!mounted.current) return;
            // Push to the root and let the server route by role. The role is not
            // known on the client yet, and hardcoding /patient/search sent every
            // HCP to the patient directory.
            router.push(ROUTES.home);
          },
          onError: (error) => {
            if (!mounted.current) return;
            setServerFieldErrors({
              email: getApiFieldError(error, "email"),
              password: getApiFieldError(error, "password"),
            });
            setSubmitError(getApiErrorMessage(error, "Invalid email or password."));
          },
        },
      );
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => errorFor(emailSchema, value) }}
      >
        {(field) => (
          <TextField
            id="email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            value={field.state.value}
            error={serverFieldErrors.email ?? firstTouchedError(field.state.meta)}
            onChange={(value) => {
              field.handleChange(value);
              if (submitError) setSubmitError(null);
            }}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <PasswordField
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={field.state.value}
            error={serverFieldErrors.password ?? firstTouchedError(field.state.meta)}
            onChange={(value) => {
              field.handleChange(value);
              if (submitError) setSubmitError(null);
            }}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      {submitError ? (
        <Callout tone="danger" role="alert">
          {submitError}
        </Callout>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          size="xl"
          className="w-full sm:w-auto sm:min-w-56"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Log in"}
        </Button>
      </div>
    </form>
  );
}
