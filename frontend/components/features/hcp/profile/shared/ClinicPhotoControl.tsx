"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { apiRequest, getApiErrorMessage } from "@/lib/api/client";

export function ClinicPhotoControl({ photoUrl }: { photoUrl?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setError(null);
    setPending(true);
    const body = new FormData();
    body.append("photo", file);
    try {
      await apiRequest("/api/hcp/profile/clinic-photo", { method: "POST", body });
      router.refresh();
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setError(null);
    setPending(true);
    try {
      await apiRequest("/api/hcp/profile/clinic-photo", { method: "DELETE" });
      router.refresh();
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            {photoUrl ? (
              // Clinic photos are served from the API storage disk.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Clinic" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImagePlus className="size-5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="type-label text-foreground">Clinic photo</p>
            <p className="mt-0.5 type-helper text-muted-foreground">
              Patients see this with your clinic after you are accepted.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>
            <Camera aria-hidden="true" />
            {photoUrl ? "Replace" : "Add photo"}
          </Button>
          {photoUrl ? (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => void remove()}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
    </div>
  );
}
