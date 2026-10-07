"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { HCP } from "@/types/hcp-directory";

export type BookingValues = {
  name: string;
  phone: string;
  date: string;
};

type BookingErrors = Partial<Record<keyof BookingValues, string>>;

const EMPTY_VALUES: BookingValues = { name: "", phone: "", date: "" };

function validate(values: BookingValues): BookingErrors {
  const errors: BookingErrors = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.phone.trim()) errors.phone = "Phone is required.";
  else if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number.";
  if (!values.date) errors.date = "Pick a preferred date.";

  return errors;
}

type HCPBookingDialogProps = {
  hcp: HCP | null;
  onClose: () => void;
  onRequest?: (hcp: HCP, values: BookingValues) => void;
};

/**
 * Booking request dialog for a single HCP.
 *
 * Owns its own form state and validation so the list item only has to decide
 * *when* it is open. Mounted once per list, keyed by HCP id, so switching
 * doctors resets the fields.
 */
export function HCPBookingDialog({ hcp, onClose, onRequest }: HCPBookingDialogProps) {
  return (
    <Dialog
      open={hcp !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {hcp ? (
          <BookingForm key={hcp.id} hcp={hcp} onClose={onClose} onRequest={onRequest} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BookingForm({
  hcp,
  onClose,
  onRequest,
}: {
  hcp: HCP;
  onClose: () => void;
  onRequest?: (hcp: HCP, values: BookingValues) => void;
}) {
  const [values, setValues] = useState<BookingValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [requested, setRequested] = useState(false);

  function update(field: keyof BookingValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onRequest?.(hcp, values);
    setRequested(true);
  }

  return (
    <>
      <DialogHeader className="items-start">
        <DialogTitle>Book a visit</DialogTitle>
        <DialogDescription>
          {hcp.fullName}
          {hcp.specialties[0] ? `, ${hcp.specialties[0]}` : ""}. We confirm the slot by phone.
        </DialogDescription>
      </DialogHeader>

      {requested ? (
        <>
          <Callout title="Visit requested" role="status">
            We saved this request for {values.name.trim()}. The clinic will call{" "}
            {values.phone.trim()} to confirm the time.
          </Callout>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </DialogFooter>
        </>
      ) : (
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <TextField
            id="booking-name"
            name="name"
            label="Your name"
            autoComplete="name"
            value={values.name}
            error={errors.name}
            required
            onChange={(value) => update("name", value)}
          />
          <TextField
            id="booking-phone"
            name="phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            error={errors.phone}
            required
            onChange={(value) => update("phone", value)}
          />
          <TextField
            id="booking-date"
            name="date"
            label="Preferred date"
            type="date"
            value={values.date}
            error={errors.date}
            required
            onChange={(value) => update("date", value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Request visit</Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}
