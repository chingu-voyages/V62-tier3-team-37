"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className="type-helper text-muted-foreground">{label}</dt>
        <dd className="truncate type-body text-foreground">{value}</dd>
      </div>
      <button
        type="button"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 type-helper font-medium",
          copied ? "bg-primary text-primary-foreground" : "bg-background text-primary",
        )}
        onClick={() => {
          void copyText(value).then((ok) => {
            if (!ok) return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
