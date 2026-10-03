"use client";

import { CalendarClock, CalendarPlus, Clock, MapPin, Stethoscope } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { formatAppointmentSlot, formatClockTime, formatLongDate } from "@/lib/format";
import { useAppointmentStore } from "@/store/use-appointment-store";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

type AppointmentFilter = "upcoming" | "past" | "all";

type DialogState =
  | { type: "closed" }
  | { type: "view"; id: string }
  | { type: "add" }
  | { type: "postpone"; id: string }
  | { type: "cancel"; id: string };

const FILTERS: { value: AppointmentFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  upcoming: "Upcoming",
  postponed: "Postponed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Today as `YYYY-MM-DD`, so a calendar date is compared without any timezone maths. */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * A visit counts as past once its date has passed, not only once something
 * flipped its status. Reading `status` alone meant an appointment whose date went
 * by kept showing under "Upcoming" indefinitely, because nothing reconciled the
 * two.
 */
function isPast(appointment: Appointment): boolean {
  if (appointment.status === "completed" || appointment.status === "cancelled") return true;
  return appointment.date < todayIso();
}

function canManage(appointment: Appointment): boolean {
  return appointment.status === "upcoming" || appointment.status === "postponed";
}

export function PatientAppointments() {
  const appointments = useAppointmentStore((state) => state.appointments);
  const addAppointment = useAppointmentStore((state) => state.addAppointment);
  const postponeAppointment = useAppointmentStore((state) => state.postponeAppointment);
  const cancelAppointment = useAppointmentStore((state) => state.cancelAppointment);

  const [filter, setFilter] = useState<AppointmentFilter>("upcoming");
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const visible = useMemo(() => {
    const filtered = appointments.filter((appointment) => {
      if (filter === "upcoming") return !isPast(appointment);
      if (filter === "past") return isPast(appointment);
      return true;
    });

    return filtered.sort((left, right) => {
      const leftKey = `${left.date}T${left.time}`;
      const rightKey = `${right.date}T${right.time}`;
      return filter === "past" ? rightKey.localeCompare(leftKey) : leftKey.localeCompare(rightKey);
    });
  }, [appointments, filter]);

  const active = appointments.find((appointment) => {
    if (dialog.type === "closed" || dialog.type === "add") return false;
    return appointment.id === dialog.id;
  });

  function closeDialog() {
    setDialog({ type: "closed" });
  }

  return (
    <section
      id="appointments"
      aria-labelledby="appointments-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="appointments-heading" className="type-h1 text-foreground">
            Your appointments
          </h1>
          <p className="mt-2 type-body text-muted-foreground">
            Review upcoming visits, add a new one, or postpone a booking.
          </p>
        </div>
        <Button type="button" onClick={() => setDialog({ type: "add" })}>
          <CalendarPlus />
          Add appointment
        </Button>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="sr-only">Filter appointments</legend>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const selected = filter === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-accent px-5 py-10 text-center type-body text-muted-foreground">
          No appointments in this list yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((appointment) => (
            <li key={appointment.id}>
              <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="type-h3 text-foreground">{appointment.doctorName}</h2>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary">
                      {STATUS_LABEL[appointment.status]}
                    </span>
                  </div>
                  <p className="mt-1 type-body text-muted-foreground">{appointment.specialty}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-label text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {formatLongDate(appointment.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {formatClockTime(appointment.time)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {appointment.location}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDialog({ type: "view", id: appointment.id })}
                  >
                    View
                  </Button>
                  {canManage(appointment) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setDialog({ type: "postpone", id: appointment.id })}
                    >
                      Postpone
                    </Button>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <AddAppointmentDialog
        open={dialog.type === "add"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSubmit={(values) => {
          addAppointment(values);
          closeDialog();
          setFilter("upcoming");
        }}
      />

      <ViewAppointmentDialog
        appointment={dialog.type === "view" ? active : undefined}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onPostpone={() => {
          if (active) setDialog({ type: "postpone", id: active.id });
        }}
        onCancel={() => {
          if (active) setDialog({ type: "cancel", id: active.id });
        }}
      />

      <PostponeAppointmentDialog
        appointment={dialog.type === "postpone" ? active : undefined}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSubmit={(date, time) => {
          if (!active) return;
          postponeAppointment(active.id, date, time);
          closeDialog();
        }}
      />

      <CancelAppointmentDialog
        appointment={dialog.type === "cancel" ? active : undefined}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onConfirm={() => {
          if (!active) return;
          cancelAppointment(active.id);
          closeDialog();
        }}
      />
    </section>
  );
}

function AddAppointmentDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    doctorName: string;
    specialty: string;
    location: string;
    date: string;
    time: string;
    reason: string;
  }) => void;
}) {
  const formId = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-start">
          <DialogTitle>Add appointment</DialogTitle>
          <DialogDescription>Book a visit with a healthcare professional.</DialogDescription>
        </DialogHeader>
        <form
          key={open ? "open" : "closed"}
          id={formId}
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const doctorName = String(data.get("doctorName") ?? "").trim();
            const date = String(data.get("date") ?? "");
            const time = String(data.get("time") ?? "");
            if (!doctorName || !date || !time) {
              setError("Doctor name, date, and time are required.");
              return;
            }
            setError(null);
            onSubmit({
              doctorName,
              specialty: String(data.get("specialty") ?? "").trim() || "General Medicine",
              location: String(data.get("location") ?? "").trim() || "Clinic",
              date,
              time,
              reason: String(data.get("reason") ?? "").trim() || "Consultation",
            });
          }}
        >
          <Field id={`${formId}-doctor`} label="Doctor" name="doctorName" required />
          <Field id={`${formId}-specialty`} label="Specialty" name="specialty" />
          <Field id={`${formId}-location`} label="Location" name="location" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${formId}-date`} label="Date" name="date" type="date" required />
            <Field id={`${formId}-time`} label="Time" name="time" type="time" required />
          </div>
          <Field id={`${formId}-reason`} label="Reason" name="reason" />
          {error ? (
            <p role="alert" className="type-helper text-destructive">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" form={formId}>
            Save appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewAppointmentDialog({
  appointment,
  onOpenChange,
  onPostpone,
  onCancel,
}: {
  appointment?: Appointment;
  onOpenChange: (open: boolean) => void;
  onPostpone: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={appointment !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {appointment ? (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>{appointment.doctorName}</DialogTitle>
              <DialogDescription>{STATUS_LABEL[appointment.status]}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3">
              <Detail icon={Stethoscope} label="Specialty" value={appointment.specialty} />
              <Detail
                icon={CalendarClock}
                label="When"
                value={`${formatAppointmentSlot(appointment.date, appointment.time)}`}
              />
              <Detail icon={MapPin} label="Location" value={appointment.location} />
              <Detail icon={Clock} label="Reason" value={appointment.reason} />
            </dl>
            <DialogFooter>
              {canManage(appointment) ? (
                <>
                  <Button type="button" variant="destructive" onClick={onCancel}>
                    Cancel visit
                  </Button>
                  <Button type="button" onClick={onPostpone}>
                    Postpone
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PostponeAppointmentDialog({
  appointment,
  onOpenChange,
  onSubmit,
}: {
  appointment?: Appointment;
  onOpenChange: (open: boolean) => void;
  onSubmit: (date: string, time: string) => void;
}) {
  const formId = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={appointment !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {appointment ? (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Postpone appointment</DialogTitle>
              <DialogDescription>
                Choose a new date and time for {appointment.doctorName}.
              </DialogDescription>
            </DialogHeader>
            <form
              key={appointment.id}
              id={formId}
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const date = String(data.get("date") ?? "");
                const time = String(data.get("time") ?? "");
                if (!date || !time) {
                  setError("A new date and time are required.");
                  return;
                }
                setError(null);
                onSubmit(date, time);
              }}
            >
              <Field
                id={`${formId}-date`}
                label="New date"
                name="date"
                type="date"
                required
                defaultValue={appointment.date}
              />
              <Field
                id={`${formId}-time`}
                label="New time"
                name="time"
                type="time"
                required
                defaultValue={appointment.time}
              />
              {error ? (
                <p role="alert" className="type-helper text-destructive sm:col-span-2">
                  {error}
                </p>
              ) : null}
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="submit" form={formId}>
                Save new time
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CancelAppointmentDialog({
  appointment,
  onOpenChange,
  onConfirm,
}: {
  appointment?: Appointment;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={appointment !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        {appointment ? (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>Cancel this visit?</DialogTitle>
              <DialogDescription>
                {appointment.doctorName} on {formatLongDate(appointment.date)} will be marked as
                cancelled.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Keep appointment
              </Button>
              <Button type="button" variant="destructive" onClick={onConfirm}>
                Cancel visit
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Uncontrolled labelled input.
 *
 * This is the fourth hand-rolled field primitive in the app, after the auth
 * `TextField`/`PasswordField` pair and the three inline copies in
 * `HcpVerificationForm`. It now composes the shared `FormField`, so it carries
 * `aria-invalid`/`aria-describedby` and a `FieldMessage` instead of dropping the
 * error wiring the other three already had.
 */
function Field({
  id,
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  error,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <FormField id={id} label={label} error={error} required={required}>
      {({ id: controlId, describedBy, invalid }) => (
        <Input
          id={controlId}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <dt className="type-helper text-muted-foreground">{label}</dt>
        <dd className="type-body text-foreground">{value}</dd>
      </div>
    </div>
  );
}
