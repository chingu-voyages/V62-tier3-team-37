import type { ReactNode } from "react";
import type { SignupRole } from "./SignupRoleSwitch";
import { StepIndicator } from "./StepIndicator";

type AuthCardProps = {
  /** Renders the step progress marker above the title. */
  step?: { current: number; total: number; role?: SignupRole };
  eyebrow?: string;
  title: string;
  subtitle: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;

  info?: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  step,
  eyebrow,
  title,
  subtitle,
  tabs,
  children,
  info,
  footer,
}: AuthCardProps) {
  return (
    <div className="m-auto w-full max-w-xl 2xl:max-w-2xl">
      <div className="flex flex-col items-center gap-3 text-center">
        {step ? <StepIndicator current={step.current} total={step.total} role={step.role} /> : null}
        {eyebrow ? <p className="type-step text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="type-h1 text-foreground">{title}</h1>
        <div className="max-w-md type-body text-muted-foreground">{subtitle}</div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-7 lg:p-8">
        {tabs}
        <div className={tabs ? "mt-5 sm:mt-6" : undefined}>{children}</div>
      </div>

      {info ? <div className="mt-4">{info}</div> : null}

      {footer ? (
        <div className="mt-6 text-center type-body text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}
