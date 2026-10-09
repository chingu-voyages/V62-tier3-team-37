import { CalendarPlus, Clock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton, skeletonKeys } from "@/components/ui/skeleton";
import type { AppointmentView } from "@/types/appointment";

/**
 * Placeholder rows while an appointments list is in flight.
 *
 * Mirrors `AppointmentCard` - title, chip, meta line, actions - so the list does not
 * jump when the real rows land. This is the *pending* state only; `AppointmentsErrorState`
 * covers a request that failed and `AppointmentsEmptyState` a request that
 * legitimately returned nothing.
 */
export function AppointmentListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-3">
      {skeletonKeys(count).map((key) => (
        <li
          key={key}
          className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-32" />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}

type AppointmentsErrorStateProps = {
  /**
   * What the list was. The heading is built from it, so the two screens cannot say
   * "your appointments" on a clinician's schedule.
   */
  subject: "your appointments" | "your schedule";
  /** The backend's message, or a network/offline fallback. */
  message: string;
  onRetry: () => void;
  /** Set while a retry is already in flight, so the button can disable itself. */
  isRetrying?: boolean;
};

/**
 * The request failed.
 *
 * Distinct from the empty state on purpose: an empty list is a normal answer and
 * needs no alarm, whereas a failure means the real appointments are still out there
 * and something has to be retried. The message comes from the API so a 401 or a 409
 * is described in the words the backend chose.
 *
 * `role="alert"` so a screen reader announces the failure without hunting for it.
 */
export function AppointmentsErrorState({
  subject,
  message,
  onRetry,
  isRetrying = false,
}: AppointmentsErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-14 text-center"
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      </div>

      <h2 className="type-h2 text-foreground">We couldn&apos;t load {subject}</h2>

      <p className="mt-2 max-w-md type-body text-muted-foreground">{message}</p>

      <Button variant="secondary" className="mt-6" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}

type AppointmentsEmptyStateProps = {
  view: AppointmentView;
  /**
   * The plural noun the heading counts, e.g. `appointments` or `visits`. Separate
   * from the error state's `subject` because the two headings read differently:
   * "No upcoming appointments" but "We couldn't load your schedule".
   */
  noun: string;
  /** Omitted where there is nothing to send the reader to. */
  action?: { label: string; onClick: () => void };
};

/**
 * A resolved but empty list.
 *
 * "Nothing here" is a success state, so it is styled as an invitation rather than as
 * a fault - and it names the action that fills the list, when there is one.
 */
export function AppointmentsEmptyState({ view, noun, action }: AppointmentsEmptyStateProps) {
  const isUpcoming = view === "upcoming";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-accent/40 px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent">
        {isUpcoming ? (
          <CalendarPlus className="size-8 text-primary/60" aria-hidden="true" />
        ) : (
          <Clock className="size-8 text-primary/60" aria-hidden="true" />
        )}
      </div>

      <h2 className="type-h2 text-foreground">
        {isUpcoming ? `No upcoming ${noun}` : `No past ${noun}`}
      </h2>

      <p className="mt-2 max-w-md type-body text-muted-foreground">
        {isUpcoming
          ? "As soon as a visit is booked with you it will appear here, with the patient, the date and the time."
          : "Once a visit has taken place it moves here, so you have the full history in one place."}
      </p>

      {isUpcoming && action ? (
        <Button variant="secondary" size="sm" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Access is gated, not broken.
 *
 * The clinician appointments routes sit behind the `hcp.verified` middleware, so an
 * unverified account is answered with a 403 rather than a list. A generic "something
 * went wrong, try again" would send someone to retry a request that can never
 * succeed; this says what is missing and where to fix it.
 */
export function AppointmentsGatedState({
  title = "Your profile isn't verified yet",
  description = "Appointments open up once your account has been verified. It usually takes a day or two.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-accent/40 px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent">
        <TriangleAlert className="size-8 text-primary/60" aria-hidden="true" />
      </div>

      <h2 className="type-h2 text-foreground">{title}</h2>
      <p className="mt-2 max-w-md type-body text-muted-foreground">{description}</p>

      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
