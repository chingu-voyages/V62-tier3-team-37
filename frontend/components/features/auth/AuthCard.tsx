import type { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";

type AuthCardProps = {
  /**
   * Progress marker. `total` is supplied by the caller because each screen knows
   * its own journey — deriving it from the role meant the stepper disagreed with
   * the flow whenever the role was not yet known.
   */
  step?: { current: number; total: number; detail?: string };
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
        {step ? (
          <div data-motion="step">
            <StepIndicator current={step.current} total={step.total} detail={step.detail} />
          </div>
        ) : null}
        {eyebrow ? <p className="type-step text-muted-foreground">{eyebrow}</p> : null}
        <h1 data-motion="heading" className="type-h1 text-foreground">
          {title}
        </h1>
        <div data-motion="subheading" className="max-w-lg type-body text-muted-foreground">
          {subtitle}
        </div>
      </div>

      {tabs ? <div className="mx-auto mt-6 w-full max-w-sm">{tabs}</div> : null}

      <div
        data-motion="card"
        className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-7 lg:p-8"
      >
        {children}
      </div>

      {info ? <div className="mt-4">{info}</div> : null}

      {footer ? (
        <div className="mt-6 text-center type-body text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}
