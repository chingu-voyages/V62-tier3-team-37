"use client";

import { cn } from "@/lib/utils";
import { type PasswordStrengthLevel, passwordStrengthLevel } from "@/lib/validation/password";

type PasswordStrengthProps = {
  value: string;
};

const LEVELS: Record<
  PasswordStrengthLevel,
  { label: string; segment: string; text: string; filled: number }
> = {
  weak: { label: "Weak", segment: "bg-rose-500/60", text: "text-rose-600", filled: 1 },
  fair: { label: "Fair", segment: "bg-amber-500/60", text: "text-amber-600", filled: 2 },
  strong: { label: "Strong", segment: "bg-emerald-500/60", text: "text-emerald-600", filled: 3 },
};

const LEVEL_ORDER: PasswordStrengthLevel[] = ["weak", "fair", "strong"];

export function PasswordStrength({ value }: PasswordStrengthProps) {
  if (value.length === 0) return null;

  const level = LEVELS[passwordStrengthLevel(value)];

  return (
    <div className="space-y-1.5">
      {/*
        A real <meter> element would be ideal but it cannot be styled to match the
        design, and `role="meter"` on a div is what this replaces. A visually
        hidden <progress> carries the value for assistive tech while the bars stay
        decorative and the label below carries the meaning in plain text.
      */}
      <progress
        className="sr-only"
        value={level.filled}
        max={LEVEL_ORDER.length}
        aria-label="Password strength"
      />

      <div className="flex gap-1" aria-hidden="true">
        {LEVEL_ORDER.map((key, index) => (
          <span
            key={key}
            className={cn(
              "h-1 flex-1 rounded-sm transition-colors",
              index < level.filled ? level.segment : "bg-border",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs", level.text)}>{level.label}</p>
    </div>
  );
}
