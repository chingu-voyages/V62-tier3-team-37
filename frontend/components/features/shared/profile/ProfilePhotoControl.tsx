"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUploadProfilePhotoMutation } from "@/hooks/use-profile-photo-mutations";
import { getApiErrorMessage } from "@/lib/api/client";
import { userInitials } from "@/lib/auth/display";
import { cn } from "@/lib/utils";
import { formatPhotoSize, validateProfilePhoto } from "@/lib/validation/photo";
import { PROFILE_PHOTO_ACCEPT, PROFILE_PHOTO_MAX_BYTES } from "@/types/profile-api";

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
 * What the server confirmed after the last successful upload.
 *
 * `seenProp` records the `photoUrl` the upload was confirmed against, which is how
 * a refreshed prop is told apart from the echo: if the server sends something
 * different, the server wins.
 */
type ConfirmedPhoto = {
  url: string;
  seenProp: string | undefined;
};

/**
 * Choose and replace the profile photo.
 *
 * A picker and a request are different things, so the control has two states.
 *
 * - **Nothing staged** - `Change` when a photo is stored, otherwise
 *   `Upload photo`, and nothing else.
 * - **A file is staged** - the avatar previews it and `Change` becomes `Confirm`,
 *   the only thing that sends the request. `Discard` sits beside it and drops the
 *   unsaved file.
 *
 * The destructive action belongs to the pending pick, not to the stored photo, so
 * it exists only in the staged state. There is no delete: a photo is replaced, not
 * removed, and a red action parked next to `Change` put a delete one misclick away
 * from choosing a new picture.
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
  const [confirmed, setConfirmed] = useState<ConfirmedPhoto | null>(null);

  const upload = useUploadProfilePhotoMutation();
  const pending = upload.isPending;

  /*
   * The endpoint answers with the stored photo's URL, so a save does not have to
   * wait for the refresh to show up: the avatar can switch to the new image the
   * moment the write lands. The refresh still runs - it is what reconciles every
   * other surface that reads the user (navbar avatar, the other profile slots) -
   * but this card no longer renders the old photo in the meantime.
   *
   * The echo is scoped to the `photoUrl` it was confirmed against: once the server
   * sends a different value, the prop is the newer truth and the local copy is
   * dropped. Derived rather than cleared in an effect, so there is no render in
   * between showing both.
   */
  const storedPhoto = confirmed && confirmed.seenProp === photoUrl ? confirmed.url : photoUrl;

  const hasPhoto = Boolean(storedPhoto);

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
      onSuccess: (response) => {
        setConfirmed({ url: response.data.profile_photo_url, seenProp: photoUrl });
        // The stored photo is now real, so the local preview has nothing left to
        // stand in for.
        replacePreview(null);
        toast.success("Profile photo updated.");
      },
      onError: (cause) => {
        // The staged file is kept, so the user can retry without re-picking.
        toast.error(getApiErrorMessage(cause));
      },
    });
  }

  /** Drop the unsaved file. Never touches what is stored. */
  function handleDiscard() {
    if (pending) return;

    replacePreview(null);
    toast("Change discarded.");
  }

  // A staged file previews in place of the stored photo, and the stored photo is
  // whichever of the server's value and the just-confirmed one is current.
  // `AvatarFallback` only renders when the image fails or is absent, so the
  // initials stay as a safety net rather than being drawn behind the preview.
  const shownPhoto = previewUrl ?? storedPhoto;
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
            accept={PROFILE_PHOTO_ACCEPT}
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

            {stagedFile ? (
              // The destructive action belongs to the staged file, so it sits beside
              // Confirm - the one moment there is something to throw away. With only a
              // stored photo there is nothing pending, and offering a red action next to
              // "Change" put a delete one misclick away from picking a new picture.
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={
                  onPrimary
                    ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                    : "text-destructive hover:bg-destructive/10"
                }
                onClick={handleDiscard}
                disabled={pending}
              >
                <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                Discard
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
              JPG, PNG or WebP up to {formatPhotoSize(PROFILE_PHOTO_MAX_BYTES)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
