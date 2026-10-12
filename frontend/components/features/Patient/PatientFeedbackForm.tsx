"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { saveClinicianReview, sendClinicianReport } from "@/lib/api/feedback-client";
import { getApiErrorMessage } from "@/lib/api/client";

type ClinicianOption = {
  id: number;
  name: string;
  specialty: string;
};

export function PatientFeedbackForm({ clinicians }: { clinicians: ClinicianOption[] }) {
  const [clinicianId, setClinicianId] = useState(String(clinicians[0]?.id ?? ""));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState<string | null>(null);
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

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="type-helper text-muted-foreground">Clinician</span>
        <select
          value={clinicianId}
          onChange={(event) => setClinicianId(event.target.value)}
          className="h-11 rounded-md border border-input bg-card px-3 type-body outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          {clinicians.map((clinician) => (
            <option key={clinician.id} value={clinician.id}>
              {clinician.name}
              {clinician.specialty ? ` · ${clinician.specialty}` : ""}
            </option>
          ))}
        </select>
      </label>

      <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Review</h2>
        <p className="mt-1 type-body text-muted-foreground">One review per clinician. Sending again updates it.</p>
        <div className="mt-4 flex gap-2" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
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
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="type-helper text-muted-foreground">Comment, optional</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 type-body outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          />
        </label>
        <Button type="button" className="mt-4" disabled={pending !== null} onClick={() => void submit("review")}>
          {pending === "review" ? "Saving…" : "Save review"}
        </Button>
      </section>

      <section className="rounded-2xl bg-background p-5 shadow-card ring-1 ring-border/70">
        <h2 className="type-h3 text-foreground">Report</h2>
        <p className="mt-1 type-body text-muted-foreground">The admin team sees this on that clinician’s record.</p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="type-helper text-muted-foreground">What happened</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={120}
            className="h-11 rounded-md border border-input bg-card px-3 type-body outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="type-helper text-muted-foreground">Details, optional</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 type-body outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={pending !== null || reason.trim() === ""}
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
