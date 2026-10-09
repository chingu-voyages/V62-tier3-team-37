import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ROUTES } from "@/lib/constants/routes";

type ProfileLayoutProps = {
  children: ReactNode;
  overview: ReactNode;
  verification: ReactNode;
  professional: ReactNode;
  details: ReactNode;
  availability: ReactNode;
};

/**
 * The profile screen is a masthead plus five independently-loaded sections.
 *
 * Every slot receives an explicit grid position, so the card a reader sees first
 * is always the one that arrives first in this markup:
 *
 * - narrow: one column — overview, professional, verification, details, availability
 * - `lg`:    overview and professional span both columns; verification and
 *            details share a row; availability closes it
 * - `xl`:    professional and details take the wide column, verification and
 *            availability the narrow one beside them
 *
 * `items-start` keeps every card at its natural height. Stretching a card to a
 * neighbour's height only ever produces a card with content at the top and a
 * void underneath, which reads as a rendering fault rather than as design.
 *
 * Reading order is why the grid is explicit at all: the previous version placed
 * availability and details in columns that inverted them relative to this
 * markup, so sighted readers saw Availability first while keyboard and screen
 * reader users hit Details first - and at `xl` two sections were laid into the
 * same cell and overlapped.
 */
export default function ProfileLayout({
  children,
  overview,
  verification,
  professional,
  details,
  availability,
}: ProfileLayoutProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      {children}

      <header className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          {/* A real link, so it is focusable, middle-clickable and prefetchable.
              A handler-less <button aria-disabled> would be focusable and announced
              as available but would do nothing. */}
          <Link
            href={ROUTES.hcpPatients}
            className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="type-label">Back</span>
          </Link>
          <h1 className="type-h1 mt-2 text-foreground">Health Care Provider Profile</h1>
          <p className="mt-1 max-w-2xl type-body text-pretty text-muted-foreground">
            Manage your professional information, credentials and availability.
          </p>
        </div>
      </header>

      {/*
        Placement is stated with explicit grid lines rather than `col-span`
        at every breakpoint. A span declared for `lg` keeps applying at `xl`
        unless another span overrides it, and `col-start` does not cancel one -
        so a card could end up spanning both rail columns and sitting on top of
        its neighbour, which is exactly the overlap this grid used to have.
        `col-end` is the counterpart of `col-start`, so start and end always
        agree.

        Rows are numbered to match the order the slots arrive in here, so the
        visual order is the source order at every width.
      */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-1 xl:col-start-1 xl:col-end-3 xl:row-start-1">
          {overview}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-2 xl:col-start-1 xl:col-end-2 xl:row-start-2">
          {professional}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:col-end-2 lg:row-start-3 xl:col-start-2 xl:col-end-3 xl:row-start-2">
          {verification}
        </div>

        <div className="min-w-0 lg:col-start-2 lg:col-end-3 lg:row-start-3 xl:col-start-1 xl:col-end-2 xl:row-start-3">
          {details}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-4 xl:col-start-2 xl:col-end-3 xl:row-start-3">
          {availability}
        </div>
      </div>
    </div>
  );
}
