"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BookingNotesProps = {
  notes: string;
  onChange: (notes: string) => void;
};

export function BookingNotes({ notes, onChange }: BookingNotesProps) {
  return (
    <div>
      <Label htmlFor="booking-notes">
        Notes
        <span className="ml-2 font-normal text-muted-foreground">Optional</span>
      </Label>
      <Textarea
        id="booking-notes"
        rows={3}
        value={notes}
        placeholder="Anything the doctor should know before the visit."
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 resize-y bg-card"
      />
    </div>
  );
}
