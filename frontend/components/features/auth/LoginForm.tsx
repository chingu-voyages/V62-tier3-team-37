"use client";

import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";

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
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    onSubmit: ({ value }) => {
      console.info("Login payload", value);
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
            placeholder="John.smith@example.com"
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

      <Button type="submit" size="lg" className="mt-1 h-11 w-full">
        Log in
      </Button>
    </form>
  );
}
