"use client";

import { useState } from "react";
import { openAdminDocument } from "@/lib/api/admin-client";

export function OpenDocumentButton({ id }: { id: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className="rounded-full bg-accent px-3 py-1 type-helper font-medium text-primary disabled:opacity-60"
        onClick={() => {
          setPending(true);
          setError(null);
          void openAdminDocument(id)
            .catch(() => setError("Could not open this file."))
            .finally(() => setPending(false));
        }}
      >
        {pending ? "Opening…" : "Open"}
      </button>
      {error ? <span className="type-helper text-destructive">{error}</span> : null}
    </span>
  );
}
