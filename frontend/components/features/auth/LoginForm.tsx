"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { getApiErrorMessage } from "@/lib/api";
import { firstTouchedError } from "./field-error";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(value: string): string | undefined {
  if (value.length === 0) return "Email address is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";

  return undefined;
}

function passwordError(value: string): string | undefined {
  if (value.length === 0) return "Password is required";

  return undefined;
}

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    onSubmit: ({ value }) => {
      setSubmitError(null);
      loginMutation.mutate(
        { email: value.email, password: value.password, remember: false },
        {
          onSuccess: () => {
            console.log("Login succeeded");
          },
          onError: (error) => {
            setSubmitError(getApiErrorMessage(error));
          },
        },
      );
    },
  });

  return (
    <form
      noValidate
      className="space-y-6 mt-8"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => emailError(value),
        }}
      >
        {(field) => (
          <TextField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={field.state.value}
            error={firstTouchedError(field.state.meta)}
            onChange={(value) => field.handleChange(value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => passwordError(value),
        }}
      >
        {(field) => (
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={field.state.value}
            error={firstTouchedError(field.state.meta)}
            onChange={(value) => field.handleChange(value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="flex">
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Forgot Password?
        </button>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="mt-1 h-11 w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
