"use client";

import { cn } from "@/lib/utils";

type PasswordStrengthProps = {
  value: string;
};

const LEVELS = [
  { label: "Weak", segment: "bg-rose-500/60", text: "text-rose-600" },
  { label: "Good", segment: "bg-amber-500/60", text: "text-amber-600" },
  { label: "Strong", segment: "bg-emerald-500/60", text: "text-emerald-600" },
] as const;

/**
 * Length-based password guide.
 *
 * Renders three thin segments — 0–7 chars raises one (Weak), 8–11 raises two
 * (Good), 12+ raises all three (Strong). Purely presentational: it is a hint
 * for the user, not a security score.
 */
export function PasswordStrength({ value }: PasswordStrengthProps) {
  const length = value.length;

  if (length === 0) return null;

  const levelIndex = length < 8 ? 0 : length < 12 ? 1 : 2;
  const activeSegments = levelIndex + 1;
  const level = LEVELS[levelIndex];

  return (
    // biome-ignore lint/a11y/useSemanticElements: native <meter> can't render three discrete visual segments.
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={activeSegments}
      aria-label={`Password strength: ${level.label}`}
      className="space-y-1.5"
    >
      <div className="flex gap-1">
        {LEVELS.map((segment, i) => (
          <span
            key={segment.label}
            className={cn(
              "h-1 flex-1 rounded-sm transition-colors",
              i < activeSegments ? level.segment : "bg-border",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs", level.text)}>{level.label}</p>
    </div>
  );
}
