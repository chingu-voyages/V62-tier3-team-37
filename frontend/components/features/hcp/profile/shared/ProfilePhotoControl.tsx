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
 * The file input is validated before the request so a rejected file costs no
 * upload, and the accepted formats mirror the API's JPG/JPEG/PNG/WebP list.
 * `Content-Type` on the multipart body is left to the browser.
 */
export function ProfilePhotoControl({
  photoUrl,
  firstName,
  lastName,
  className,
}: ProfilePhotoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadProfilePhotoMutation();
  const remove = useDeleteProfilePhotoMutation();
  const pending = upload.isPending || remove.isPending;

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
    upload.mutate(file, { onError: (cause) => setError(getApiErrorMessage(cause)) });
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
            >
              <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
              {upload.isPending ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
            </Button>

            {photoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() =>
                  remove.mutate(undefined, { onError: (c) => setError(getApiErrorMessage(c)) })
                }
                disabled={pending}
              >
                <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>

          <p className="type-helper text-muted-foreground">
            JPG, PNG or WebP up to {formatPhotoSize(PROFILE_LIMITS.photoBytes)}.
          </p>
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
