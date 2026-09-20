import type { ReactNode } from "react";

type AuthCardProps = {
  eyebrow?: string;
  title: string;
  subtitle: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  info?: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  tabs,
  children,
  info,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">{eyebrow}</p>
      ) : null}

      <div className="text-center">
        <h1 className="text-h1 tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4 shadow-sm sm:p-6">
        {tabs}
        <div className={tabs ? "mt-4" : undefined}>{children}</div>
      </div>

      {info ? (
        <div className="mt-3 leading-relaxed flex flex-col items-center text-center gap-2.5 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
          {/* <CircleHelp className="mt-0.5 size-4 shrink-0 " /> */}
          {info}
        </div>
      ) : null}

      {footer ? <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p> : null}
    </div>
  );
}
