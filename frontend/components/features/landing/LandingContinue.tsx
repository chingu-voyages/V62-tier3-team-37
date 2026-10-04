import { CalendarCheck, SlidersHorizontal, UserRound } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

const STARTS = [
  {
    icon: UserRound,
    title: "A visit before an account",
    body: "Leave your name, phone, and a preferred date. You can open an account afterward if you want that request kept with you.",
  },
  {
    icon: SlidersHorizontal,
    title: "A shorter list",
    body: "Fee, years in practice, gender, and whether someone can see you today or tomorrow live under Extra options.",
  },
  {
    icon: CalendarCheck,
    title: "The same clinician again",
    body: "Once you have an account, upcoming visits stay in one place instead of starting from a new search.",
  },
] as const;

const PRACTICES = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
] as const;

const STEPS = [
  {
    title: "Search the directory",
    body: "Look by name, practice, city, area, or insurance. Nothing is booked until you ask.",
  },
  {
    title: "Narrow the matches",
    body: "Open Extra options when the first list is still too wide.",
  },
  {
    title: "Request the visit",
    body: "Book as guest sends a request for that clinician. It does not create an account.",
  },
  {
    title: "Keep it only if you want to",
    body: "Sign up later to manage the visit. Guests can stop after the request.",
  },
] as const;

/**
 * Sections under the existing landing search.
 * The search itself stays the way to book; these only explain it.
 */
export function LandingContinue() {
  return (
    <>
      <section aria-labelledby="landing-starts" className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 id="landing-starts" className="type-h2 text-foreground">
            Three ways people start
          </h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            The search above is where a visit begins. These are the reasons someone uses it.
          </p>
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
            {STARTS.map((item) => (
              <li key={item.title} className="flex gap-4 p-5 sm:p-6">
                <item.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="type-h3 text-foreground">{item.title}</h3>
                  <p className="mt-1 type-body text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="landing-practices" className="bg-muted">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 id="landing-practices" className="type-h2 text-foreground">
            Practices already in the directory
          </h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            Choose one in the specialty filter, or jump back to the search and type it.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PRACTICES.map((practice) => (
              <li key={practice}>
                <a
                  href="#landing-search"
                  className="inline-flex rounded-full bg-card px-3.5 py-2 type-label text-primary shadow-soft ring-1 ring-border transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {practice}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="landing-steps" className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 id="landing-steps" className="type-h2 text-foreground">
            After you choose Book as guest
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-primary"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="type-h3 text-foreground">{step.title}</h3>
                  <p className="mt-1 type-body text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="landing-clinicians" className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-xl">
            <h2 id="landing-clinicians" className="type-h2">
              HealthHub for doctors
            </h2>
            <p className="mt-2 type-body text-primary-foreground/80">
              Create a clinician account, complete verification, and keep your profile where
              patients search.
            </p>
          </div>
          <Link
            href={`${ROUTES.auth}?role=HCP`}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Open a clinician account
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
