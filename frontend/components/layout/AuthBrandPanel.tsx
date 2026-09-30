import { BadgeCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthHubLogo } from "./HealthHubLogo";

const _TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    description: "Encrypted records with consent-driven access controls.",
  },
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    description: "Every clinician is credential-checked before they practise.",
  },
  {
    icon: HeartHandshake,
    title: "Connected care",
    description: "Appointments, results and follow-up in one shared timeline.",
  },
] as const;

type AuthBrandPanelProps = {
  className?: string;
};

export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <aside
      aria-label="About HealthHub"
      className={cn(
        "relative hidden min-w-0 overflow-hidden bg-[url('/images/auth/background-signup.webp')] bg-left lg:bg-center bg-no-repeat bg-contain lg:bg-cover text-primary-foreground lg:flex lg:flex-col",
        className,
      )}
    >
      {/* <Image src="/images/auth/top-shapes.svg" className="absolute opacity-70 right-0" alt="Top shapes" width={300} height={300} /> */}
      {/* <Image src="/images/auth/bottom-shapes.svg" className="absolute opacity-60 bottom-0 right-5" alt="Bottom shapes" width={150} height={300} />  */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent "
      />

      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-8 px-8 py-9 xl:px-12 xl:py-11 2xl:gap-10 2xl:px-16 2xl:py-14">
        <div className="flex flex-col gap-12 2xl:gap-25">
          <HealthHubLogo tone="light" className="w-fit" />

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

        {/* <div className="relative min-h-40 max-h-80 flex-1 overflow-hidden rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5">
           <Image
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            fill
            priority
            sizes="(min-width: 1536px) 34rem, (min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          /> 
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/70 via-primary/10 to-transparent"
          />
        </div> */}

        <p className="type-helper text-primary-foreground/65">
          © 2026 HealthHub. All rights reserved.
        </p>
      </div>
    </aside>
  );
}

{
  /* <ul className="mt-auto flex flex-col gap-4 xl:gap-5">
          {TRUST_POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground"
              >
                <point.icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="type-label text-primary-foreground">{point.title}</p>
                <p className="mt-0.5 type-helper text-primary-foreground/65">{point.description}</p>
              </div>
            </li>
          ))}
        </ul> */
}
