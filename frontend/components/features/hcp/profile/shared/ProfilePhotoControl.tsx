"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useDeleteProfilePhotoMutation,
  useUploadProfilePhotoMutation,
} from "@/hooks/use-hcp-profile-mutations";
import { getApiErrorMessage } from "@/lib/api/client";
import { userInitials } from "@/lib/auth/display";
import { cn } from "@/lib/utils";
import { formatPhotoSize, validateProfilePhoto } from "@/lib/validation/photo";
import { PHOTO_ACCEPT, PROFILE_LIMITS } from "@/types/hcp-profile-api";

type ProfilePhotoControlProps = {
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  /**
   * Surface the control sits on. The overview's identity panel is filled with
   * Primary Green, where the destructive red and the muted grey of the default
   * treatment fall below a readable contrast - so on it the controls switch to
   * white-on-green.
   */
  tone?: "surface" | "primary";
  className?: string;
};

/**
 * Upload, replace and remove the profile photo.
 *
 * A picker and a request are different things, so the control has two states.
 *
 * - **Nothing staged** - `Change` when a photo is stored, otherwise
 *   `Upload photo`. `Remove` appears alongside `Change`.
 * - **A file is staged** - the avatar previews it and `Change` becomes
 *   `Confirm`, which is the only thing that sends the request. `Remove` stays
 *   available and drops the staged file.
 *
 * The avatar shows the staged file in place of the stored photo, with no
 * "preview" badge: the visible change *is* the signal, and a label describing an
 * image the user just picked is noise. The filename line below carries the only
 * fact that is not visible — that it has not been saved.
 *
 * Outcomes are reported as a toast rather than inline text. An upload failure is
 * an event with a beginning and an end, not a persistent field state, and a
 * permanent callout would sit there after the user moved on.
 *
 * The object URL is revoked whenever it is replaced or the control unmounts,
 * otherwise every picked file leaks for the life of the tab.
 *
 * `tone` names the surface the control is dropped onto, because the primary
 * green identity panel cannot carry the default white-surface treatments.
 */
export function ProfilePhotoControl({
  photoUrl,
  firstName,
  lastName,
  tone = "surface",
  className,
}: ProfilePhotoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const upload = useUploadProfilePhotoMutation();
  const remove = useDeleteProfilePhotoMutation();
  const pending = upload.isPending || remove.isPending;

  const hasPhoto = Boolean(photoUrl);

  // Object URLs are not released with the component, so the live one is tracked
  // in a ref purely to revoke it on unmount.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function replacePreview(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setStagedFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file fires `change` again.
    event.target.value = "";
    if (!file) return;

    const invalid = validateProfilePhoto(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    replacePreview(file);
  }

  function handleConfirm() {
    if (!stagedFile || pending) return;

    upload.mutate(stagedFile, {
      onSuccess: () => {
        // Only now does the stored photo become the avatar's source.
        replacePreview(null);
        toast.success("Profile photo updated.");
      },
      onError: (cause) => {
        // The staged file is kept, so the user can retry without re-picking.
        toast.error(getApiErrorMessage(cause));
      },
    });
  }

  function handleRemove() {
    if (pending) return;

    // From the staged state this discards the unsaved file; otherwise it deletes
    // the stored photo.
    if (stagedFile) {
      replacePreview(null);
      toast("Change discarded.");
      return;
    }

    remove.mutate(undefined, {
      onSuccess: () => {
        replacePreview(null);
        toast.success("Profile photo removed.");
      },
      onError: (cause) => toast.error(getApiErrorMessage(cause)),
    });
  }

  // A staged file previews in place of the stored photo. `AvatarFallback` only
  // renders when the image fails or is absent, so the initials stay as a safety
  // net rather than being drawn behind the preview.
  const shownPhoto = previewUrl ?? photoUrl;
  const uploading = upload.isPending;
  const onPrimary = tone === "primary";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="size-20">
            {shownPhoto ? <AvatarImage src={shownPhoto} alt="" /> : null}
            <AvatarFallback className="bg-accent type-h4 font-semibold text-primary">
              {userInitials({ first_name: firstName, last_name: lastName })}
            </AvatarFallback>
          </Avatar>

          {uploading ? (
            <div
              role="status"
              aria-label="Saving photo"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70"
            >
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            onChange={handleFile}
            className="sr-only"
            aria-label="Choose a profile photo"
          />

          <div className="flex flex-wrap gap-2">
            {stagedFile ? (
              <Button
                type="button"
                // On the green identity panel the filled primary button would be
                // dark-on-dark, so Confirm takes the light secondary surface.
                variant={onPrimary ? "secondary" : "default"}
                size="sm"
                onClick={handleConfirm}
                disabled={pending}
              >
                <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
                {uploading ? "Confirming…" : "Confirm"}
              </Button>
            ) : hasPhoto ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openPicker}
                disabled={pending}
              >
                <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
                Change
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openPicker}
                disabled={pending}
              >
                <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
                Upload photo
              </Button>
            )}

            {hasPhoto || stagedFile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={
                  onPrimary
                    ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                    : "text-destructive hover:bg-destructive/10"
                }
                onClick={handleRemove}
                disabled={pending}
              >
                <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                {stagedFile ? "Discard" : remove.isPending ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>

          {stagedFile ? (
            // Names the file Confirm will send. It has to be stated: the avatar
            // cannot show that this image is not yet saved.
            <p
              className={cn(
                "type-helper",
                onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {stagedFile.name} · {formatPhotoSize(stagedFile.size)} — not saved yet
            </p>
          ) : (
            <p
              className={cn(
                "type-helper",
                onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              JPG, PNG or WebP up to {formatPhotoSize(PROFILE_LIMITS.photoBytes)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
