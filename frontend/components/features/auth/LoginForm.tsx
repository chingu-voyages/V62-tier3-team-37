"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";

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

const LINK_CLASS =
  "rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/85 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const router = useRouter();

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
            router.push("/patient/search");
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
      className="flex flex-col gap-5"
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

      <div className="-mt-2 flex">
        <button
          type="button"
          className={LINK_CLASS}
          onClick={() => router.push("/auth/forgot-password")}
        >
          Forgot Password?
        </button>
      </div>

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
