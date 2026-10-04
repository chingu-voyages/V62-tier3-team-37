"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  useDeleteProfilePhotoMutation,
  useUploadProfilePhotoMutation,
} from "@/hooks/use-hcp-profile-mutations";
import { getApiErrorMessage } from "@/lib/api/client";
import { userInitials } from "@/lib/auth/display";
import { formatPhotoSize, validateProfilePhoto } from "@/lib/validation/photo";
import { PHOTO_ACCEPT, PROFILE_LIMITS } from "@/types/hcp-profile-api";

type ProfilePhotoControlProps = {
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
};

/**
 * Upload, replace and remove the profile photo.
 *
 * Three states, because a picker and a request are different things:
 *
 * - **No photo** - one `Upload photo` button.
 * - **Photo stored** - `Change` and `Remove`. Remove returns to the first state.
 * - **File chosen, not sent** - the upload button becomes a primary `Update`
 *   that actually sends the request.
 *
 * Selecting a file used to upload it immediately, so the button labelled "Replace
 * photo" was the only control and there was no way to see what was about to be
 * sent or to back out of a mis-click. Staging the file first makes the pending
 * change visible, gives `Remove` somewhere to return to, and leaves `Change`
 * available so a wrongly picked file can be swapped before anything is sent.
 *
 * The file is validated before it is staged, so a rejected file never reaches the
 * Update button. `Content-Type` on the multipart body is left to the browser.
 */
export function ProfilePhotoControl({
  photoUrl,
  firstName,
  lastName,
  className,
}: ProfilePhotoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadProfilePhotoMutation();
  const remove = useDeleteProfilePhotoMutation();
  const pending = upload.isPending || remove.isPending;

  const hasPhoto = Boolean(photoUrl);

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
      setError(invalid);
      return;
    }

    setError(null);
    setStagedFile(file);
  }

  function handleUpdate() {
    if (!stagedFile || pending) return;

    upload.mutate(stagedFile, {
      onSuccess: () => {
        setStagedFile(null);
        setError(null);
      },
      onError: (cause) => setError(getApiErrorMessage(cause)),
    });
  }

  function handleRemove() {
    if (pending) return;

    remove.mutate(undefined, {
      onSuccess: () => {
        // Back to the empty state: the upload button returns.
        setStagedFile(null);
        setError(null);
      },
      onError: (cause) => setError(getApiErrorMessage(cause)),
    });
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <Avatar className="size-20 shrink-0">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback className="bg-accent type-h4 font-semibold text-primary">
            {userInitials({ first_name: firstName, last_name: lastName })}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
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
              <Button type="button" size="sm" onClick={handleUpdate} disabled={pending}>
                <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
                {upload.isPending ? "Updating…" : "Update"}
              </Button>
            ) : null}

            {hasPhoto ? (
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
            ) : stagedFile ? null : (
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

            {hasPhoto ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                disabled={pending}
              >
                <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                {remove.isPending ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>

          {stagedFile ? (
            // Names the file the Update button will send, so the pending change is
            // legible rather than implied.
            <p className="type-helper text-muted-foreground">
              {stagedFile.name} · {formatPhotoSize(stagedFile.size)} — not saved yet
            </p>
          ) : (
            <p className="type-helper text-muted-foreground">
              JPG, PNG or WebP up to {formatPhotoSize(PROFILE_LIMITS.photoBytes)}.
            </p>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-3">
          <Callout tone="danger">{error}</Callout>
        </div>
      ) : null}
    </div>
  );
}
