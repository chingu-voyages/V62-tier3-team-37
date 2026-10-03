import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="type-label">Back</span>
          </button>

          <h1 className="type-h1 mt-2 text-foreground">Health Care Provider Profile</h1>
          <p className="mt-1 type-body text-muted-foreground">
            Manage your professional information, credentials and availability.
          </p>
        </div>

        <Button variant="outline" className="self-start">
          Edit Profile
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 md:col-span-2 md:row-start-1 xl:col-start-1 xl:row-start-1">
          {overview}
        </div>

        <div className="min-w-0 self-start md:col-start-1 md:row-start-3 xl:col-start-3 xl:row-span-2 xl:row-start-1">
          {verification}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-2 md:row-start-3 xl:col-start-1 xl:row-start-3">
          {professional}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-2 md:row-start-4 xl:col-start-2 xl:row-start-3">
          {details}
        </div>

        <div className="flex min-w-0 flex-col md:col-start-1 md:row-start-4 xl:col-start-3 xl:row-start-3">
          {availability}
        </div>
      </div>
    </div>
  );
}
