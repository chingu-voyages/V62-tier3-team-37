"use client";
import { usePathname } from "next/dist/client/components/navigation";
import { cn } from "@/lib/utils";
import { HealthHubLogo } from "./HealthHubLogo";

type AuthBrandPanelProps = {
  className?: string;
};

/**
 * Left-hand brand panel on the auth routes.
 *
 * The decorative imagery is a CSS background rather than `next/image`: it is a
 * single pre-composed asset used as a cover layer behind a text overlay, so it
 * gains nothing from the image optimizer.
 */
export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  const pathname = usePathname();
  return (
    <aside
      aria-label="About HealthHub"
      className={cn(
        "relative hidden min-w-0 overflow-hidden bg-[url('/images/auth/background-signup.webp')] bg-left lg:bg-center bg-no-repeat bg-contain lg:bg-cover text-primary-foreground lg:flex lg:flex-col",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent "
      />

      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-8 px-8 py-9 xl:px-12 xl:py-11 2xl:gap-10 2xl:px-16 2xl:py-14">
        <div className="flex flex-col gap-12 2xl:gap-25">
          {pathname === "/auth" ? (
            <HealthHubLogo tone="light" className="w-fit" />
          ) : (
            <HealthHubLogo tone="dark" className="w-fit" />
          )}

          <div className="max-w-md md:max-w-lg xl:max-w-lg 2xl:max-w-xl">
            <p className="flex items-center gap-2 type-step text-accent/90 2xl:gap-2.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-secondary md:size-2 2xl:size-2"
              />
              Healthcare, connected
            </p>
            <p className="mt-3 type-display text-primary-foreground 2xl:mt-5 md:leading-[1.25rem] lg:leading-[2.75rem] xl:leading-[3.75rem] 2xl:leading-[4.5rem] md:text-[2.5rem] lg:text-[2.8rem] xl:text-[3.25rem] 2xl:text-[4rem]">
              Your patient data,
              <br />
              <span className="type-display text-secondary md:leading-[3rem] lg:leading-[2.75rem] xl:leading-[3.75rem] 2xl:leading-[4.5rem] md:text-[2.5rem] lg:text-[2.5rem] xl:text-[3.25rem] 2xl:text-[4rem]">
                secured and private.
              </span>
            </p>
            <p className="mt-4 type-body text-primary-foreground/70 xl:mt-6 2xl:mt-7 md:text-base lg:text-base xl:text-lg 2xl:text-[1.375rem] md:leading-relaxed lg:leading-relaxed 2xl:leading-relaxed">
              We use industry-leading encryption and AI-driven protocols to ensure medical
              information is always protected.
            </p>
          </div>
        </div>

        <p className="type-helper text-primary-foreground/65">
          © 2026 HealthHub. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
