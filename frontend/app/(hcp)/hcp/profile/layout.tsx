import type { ReactNode } from "react";

type ProfileLayoutProps = {
  children: ReactNode;
  overview: ReactNode;
  verification: ReactNode;
  professional: ReactNode;
  details: ReactNode;
  availability: ReactNode;
};

export default function ProfileLayout({
  children,
  overview,
  verification,
  professional,
  details,
  availability,
}: ProfileLayoutProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      {children}

      {/*
        Explicit grid placement, in DOM order at every breakpoint.

        The previous version placed `availability` in column 1 and `details` in
        column 2 at `md`, which inverted the two relative to their order in this
        markup: sighted readers saw Availability first while keyboard and screen
        reader users hit Details first. Each item now sits in the column its source
        order implies, and row numbers stay contiguous so no empty row is left
        where the old `md:row-start-3` / `md:row-start-4` pair skipped row 2.
      */}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 md:col-span-2 md:row-start-1 xl:col-start-1 xl:row-start-1">
          {overview}
        </div>

        <div className="min-w-0 self-start md:col-start-1 md:row-start-2 xl:col-start-3 xl:row-span-2 xl:row-start-1">
          {verification}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-2 md:row-start-2 xl:col-start-1 xl:row-start-2">
          {professional}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-1 md:row-start-3 xl:col-start-2 xl:row-start-2">
          {details}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-2 md:row-start-3 xl:col-start-3 xl:row-start-2">
          {availability}
        </div>
      </div>
    </div>
  );
}
