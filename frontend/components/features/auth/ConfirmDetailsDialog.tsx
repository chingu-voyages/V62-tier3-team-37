"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SIGNUP_ROLE_LABELS, type SignupRole } from "@/types/auth";

type ConfirmDetailsDialogProps = {
  open: boolean;
  role: SignupRole;
  /** Trimmed values as currently typed, so the dialog mirrors the live form. */
  values: { firstName: string; lastName: string; email: string };
  isPending: boolean;
  onConfirm: () => void;
  onEdit: () => void;
};

/**
 * Review step before the account is created.
 *
 * Extracted from `RegisterForm` and loaded on demand: it is unreachable until
 * every field validates, so nobody pays for Radix's dialog, portal and focus
 * trap until they have actually filled the form in.
 */
export function ConfirmDetailsDialog({
  open,
  role,
  values,
  isPending,
  onConfirm,
  onEdit,
}: ConfirmDetailsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape and overlay clicks close the dialog, but never mid-request:
        // the mutation is already in flight and dismissing would strand it.
        if (!next && !isPending) onEdit();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check these details</DialogTitle>
          <DialogDescription>
            {role === "HCP"
              ? "We'll create the clinician account and email a code to this address. Credentials come after the code."
              : "We'll create your patient account and email a code to this address."}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3">
          <div>
            <dt className="type-helper text-muted-foreground">Name</dt>
            <dd className="type-body text-foreground">
              {values.firstName} {values.lastName}
            </dd>
          </div>
          <div>
            <dt className="type-helper text-muted-foreground">Email</dt>
            <dd className="type-body text-foreground">{values.email}</dd>
          </div>
          <div>
            <dt className="type-helper text-muted-foreground">Account</dt>
            <dd className="type-body text-foreground">{SIGNUP_ROLE_LABELS[role]}</dd>
          </div>
        </dl>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Edit details
            </Button>
          </DialogClose>
          <Button onClick={onConfirm} size="lg" className="w-full sm:w-auto" disabled={isPending}>
            {isPending ? "Creating account…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
