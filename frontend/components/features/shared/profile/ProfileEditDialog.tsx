"use client";

import { Pencil } from "lucide-react";
import { useId, useState } from "react";
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

type ProfileEditDialogProps = {
  title: string;
  description: string;
  /** Accessible name for the pencil button in the card header. Omit to hide it. */
  triggerLabel?: string;
  submitLabel?: string;
  /** Form-level error text, e.g. a 422 summary. */
  error?: string | null;
  /** Extra in-flight work, e.g. a slot delete, that should also lock the dialog. */
  pending?: boolean;
  /**
   * Called whenever the dialog opens. Editors use it to re-seed their draft from
   * the latest server props, so reopening after a save never shows the values
   * that were just replaced.
   */
  onOpen?: () => void;
  /**
   * Perform the write. Resolve to close the dialog, reject to keep it open - the
   * editor is responsible for capturing the message into `error` before it
   * rejects.
   */
  onSubmit: () => unknown;
  children: React.ReactNode;
};

/**
 * Shell shared by every section editor: a pencil trigger, a scrollable dialog body
 * and a submit row that reflects the mutation's pending state.
 *
 * Owning the dialog here means the five editors do not each re-implement focus
 * handling, the pending state, or where the error banner sits - and, more
 * importantly, that closing on success is not something each editor has to
 * remember. It previously never closed at all: a successful save left the dialog
 * open over data the server had already replaced.
 *
 * The trigger is a `triggerLabel`, not a rendered node, so the button owns its own
 * click handler. It used to be wrapped in a `<span onClick>`, which made the
 * affordance a click target with no keyboard equivalent.
 */
export function ProfileEditDialog({
  title,
  description,
  triggerLabel,
  submitLabel = "Save changes",
  error,
  pending = false,
  onOpen,
  onSubmit,
  children,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const busy = pending || submitting;

  function handleOpenChange(next: boolean) {
    // Keep the dialog open while the write is in flight so the form does not
    // unmount mid-request.
    if (busy) return;
    setOpen(next);
    if (next) onOpen?.();
  }

  async function handleSubmit() {
    if (busy) return;
    setSubmitting(true);
    try {
      await onSubmit();
      setOpen(false);
    } catch {
      // The editor already surfaced the message through `error`; staying open
      // lets the user correct the input without retyping the form.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {triggerLabel ? (
        <EditTrigger label={triggerLabel} onClick={() => handleOpenChange(true)} />
      ) : null}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="items-start">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <form
            id={formId}
            noValidate
            className="max-h-[65vh] overflow-y-auto pr-1"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="flex flex-col gap-4">{children}</div>

            {error ? (
              <div className="mt-4">
                <Callout tone="danger">{error}</Callout>
              </div>
            ) : null}
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Pencil trigger for `ProfileEditDialog`. A real button, so it is keyboard-operable. */
export function EditTrigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Pencil className="size-4" aria-hidden="true" />
    </Button>
  );
}
