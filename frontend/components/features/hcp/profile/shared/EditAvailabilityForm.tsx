"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProfileEditDialog } from "@/components/features/shared/profile";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import {
  useDeleteAvailabilitySlotMutation,
  useReplaceAvailabilityMutation,
} from "@/hooks/use-hcp-profile-mutations";
import { getApiErrorMessage } from "@/lib/api/client";
import type { HcpAvailabilitySlot } from "@/types/hcp-profile";
import { type ApiWorkingDay, PROFILE_LIMITS } from "@/types/hcp-profile-api";

const DAYS: { value: ApiWorkingDay; label: string }[] = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type DraftSlot = {
  /** Existing server id, or null for a newly added row. */
  id: number | null;
  day: ApiWorkingDay;
  startTime: string;
  endTime: string;
};

type EditAvailabilityFormProps = {
  slots: HcpAvailabilitySlot[];
};

function toDraft(slots: HcpAvailabilitySlot[]): DraftSlot[] {
  return slots.map((slot) => ({
    id: slot.id,
    day: slot.day as ApiWorkingDay,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

/**
 * Overlap check mirroring the server rule: two slots may not overlap on the same
 * day, but touching slots (12:00 and 12:00) are allowed.
 */
function findOverlap(slots: DraftSlot[]): string | null {
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const a = slots[i];
      const b = slots[j];
      if (a.day !== b.day) continue;
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        const day = DAYS.find((entry) => entry.value === a.day)?.label ?? a.day;
        return `${day}: ${a.startTime}–${a.endTime} overlaps ${b.startTime}–${b.endTime}.`;
      }
    }
  }
  return null;
}

function validate(slots: DraftSlot[]): string | null {
  if (slots.length > PROFILE_LIMITS.availabilitySlots) {
    return `You can have up to ${PROFILE_LIMITS.availabilitySlots} slots.`;
  }

  for (const slot of slots) {
    if (!TIME_PATTERN.test(slot.startTime) || !TIME_PATTERN.test(slot.endTime)) {
      return "Every slot needs a start and end time.";
    }
    if (slot.endTime <= slot.startTime) {
      return "Each slot must end after it starts.";
    }
  }

  return findOverlap(slots);
}

/**
 * Availability editor.
 *
 * Two endpoints, matching the API: `PUT` replaces the whole schedule (so the editor
 * always submits every row), and `DELETE` removes a single persisted slot by id.
 * New rows have no id, so they can only be committed through the PUT — which is
 * why the delete buttons are disabled for unsaved rows rather than silently doing
 * nothing.
 */
export function EditAvailabilityForm({ slots }: EditAvailabilityFormProps) {
  const [draft, setDraft] = useState<DraftSlot[]>(() => toDraft(slots));
  const [formError, setFormError] = useState<string | null>(null);

  const replaceMutation = useReplaceAvailabilityMutation();
  const deleteMutation = useDeleteAvailabilitySlotMutation();

  function update(index: number, patch: Partial<DraftSlot>) {
    setDraft((previous) =>
      previous.map((slot, position) => (position === index ? { ...slot, ...patch } : slot)),
    );
    setFormError(null);
  }

  function addRow() {
    setDraft((previous) => [
      ...previous,
      { id: null, day: "MON", startTime: "09:00", endTime: "12:00" },
    ]);
  }

  function removeRow(index: number) {
    setDraft((previous) => previous.filter((_, position) => position !== index));
  }

  async function handleSubmit() {
    setFormError(null);

    const problem = validate(draft);
    if (problem) {
      setFormError(problem);
      // Reject so the dialog stays open instead of reporting a local validation
      // failure as a successful save.
      throw new Error(problem);
    }

    try {
      await replaceMutation.mutateAsync({
        slots: draft.map((slot) => ({
          day: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
        })),
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      throw error;
    }
  }

  const pending = replaceMutation.isPending || deleteMutation.isPending;

  return (
    <ProfileEditDialog
      title="Edit availability"
      description="Set the days and hours patients can book with you."
      triggerLabel="Edit availability"
      error={formError}
      pending={pending}
      onOpen={() => {
        setDraft(toDraft(slots));
        setFormError(null);
      }}
      onSubmit={handleSubmit}
    >
      {draft.length === 0 ? (
        <Callout>No availability set. Add a slot to start accepting bookings.</Callout>
      ) : null}

      {draft.map((slot, index) => {
        const rowKey = slot.id ?? `new-${index}`;
        return (
          <div key={rowKey} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor={`slot-day-${rowKey}`}>Day</Label>
                <Select
                  value={slot.day}
                  onValueChange={(value) => update(index, { day: value as ApiWorkingDay })}
                >
                  <SelectTrigger id={`slot-day-${rowKey}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`slot-start-${rowKey}`}>From</Label>
                <TextField
                  id={`slot-start-${rowKey}`}
                  ariaLabel={`Start time for slot ${index + 1}`}
                  type="time"
                  value={slot.startTime}
                  onChange={(value) => update(index, { startTime: value })}
                />
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`slot-end-${rowKey}`}>To</Label>
                <TextField
                  id={`slot-end-${rowKey}`}
                  ariaLabel={`End time for slot ${index + 1}`}
                  type="time"
                  value={slot.endTime}
                  onChange={(value) => update(index, { endTime: value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              {slot.id === null ? (
                // No server id yet, so DELETE cannot address it. The row is removed
                // from the draft and committed by the next PUT.
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  disabled={pending}
                >
                  <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                  Remove row
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    deleteMutation.mutate(slot.id as number, {
                      onError: (error) => setFormError(getApiErrorMessage(error)),
                    })
                  }
                  disabled={pending}
                >
                  <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                  {deleteMutation.isPending ? "Deleting…" : "Delete slot"}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={draft.length >= PROFILE_LIMITS.availabilitySlots || pending}
      >
        <Plus className="mr-2 size-4" aria-hidden="true" />
        Add slot
      </Button>

      <Callout>
        Saving replaces your entire schedule. Existing slots that are not listed here will be
        removed.
      </Callout>
    </ProfileEditDialog>
  );
}
