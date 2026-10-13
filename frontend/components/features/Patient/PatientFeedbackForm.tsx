"use client";

import { useState } from "react";
import { SelectField } from "@/components/features/shared/profile";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import { getApiErrorMessage } from "@/lib/api/client";
import { saveClinicianReview, sendClinicianReport } from "@/lib/api/feedback-client";

type ClinicianOption = {
  id: number;
  name: string;
  specialty: string;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Rate a clinician, or report a problem with one.
 *
 * Two independent submissions share the selected clinician but nothing else, so
 * each keeps its own pending flag and a patient can send a report without
 * leaving a review behind. `pending` holds the action in flight rather than a
 * boolean, which is what lets each button show its own label.
 */
export function PatientFeedbackForm({ clinicians }: { clinicians: ClinicianOption[] }) {
  const [clinicianId, setClinicianId] = useState(String(clinicians[0]?.id ?? ""));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState<"review" | "report" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "review" | "report") {
    setPending(action);
    setMessage(null);
    setError(null);
    try {
      const id = Number(clinicianId);
      if (action === "review") {
        const result = await saveClinicianReview(id, rating, comment);
        setMessage(result.message);
        setComment("");
      } else {
        const result = await sendClinicianReport(id, reason, details);
        setMessage(result.message);
        setReason("");
        setDetails("");
      }
    } catch (cause) {
      setError(getApiErrorMessage(cause, "That did not send."));
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        id="feedback-clinician"
        label="Clinician"
        value={clinicianId}
        onChange={setClinicianId}
        options={clinicians.map((clinician) => ({
          value: String(clinician.id),
          label: clinician.specialty
            ? `${clinician.name} · ${clinician.specialty}`
            : clinician.name,
        }))}
      />

      <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Review</h2>
        <p className="mt-1 type-body text-muted-foreground">
          One review per clinician. Sending again updates it.
        </p>
        <fieldset className="mt-4 border-0 p-0">
          <legend className="sr-only">Rating, 1 to 5</legend>
          <div className="flex gap-2">
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={rating === value}
                className={
                  rating === value
                    ? "size-10 rounded-full bg-primary type-label text-primary-foreground"
                    : "size-10 rounded-full bg-accent type-label text-primary"
                }
                onClick={() => setRating(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          <TextField
            id="feedback-comment"
            label="Comment, optional"
            ariaLabel="Comment, optional"
            value={comment}
            onChange={setComment}
          />
        </div>
        <Button
          type="button"
          className="mt-4"
          disabled={busy}
          onClick={() => void submit("review")}
        >
          {pending === "review" ? "Saving…" : "Save review"}
        </Button>
      </section>

      <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Report</h2>
        <p className="mt-1 type-body text-muted-foreground">
          The admin team sees this on that clinician&rsquo;s record.
        </p>
        <div className="mt-4">
          <TextField
            id="feedback-reason"
            label="What happened"
            value={reason}
            onChange={setReason}
            maxLength={120}
            required
          />
        </div>
        <div className="mt-3">
          <TextField
            id="feedback-details"
            label="Details, optional"
            ariaLabel="Details, optional"
            value={details}
            onChange={setDetails}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={busy || reason.trim() === ""}
          onClick={() => void submit("report")}
        >
          {pending === "report" ? "Sending…" : "Send report"}
        </Button>
      </section>

      {message ? <Callout tone="info">{message}</Callout> : null}
      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}
    </div>
  );
}
