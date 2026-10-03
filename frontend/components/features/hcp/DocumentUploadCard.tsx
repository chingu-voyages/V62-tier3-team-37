"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DOCUMENT_FILE_ACCEPT,
  formatFileSize,
  getFileTypeLabel,
  validateDocumentFile,
} from "@/lib/validation/files";

type DocumentUploadCardProps = {
  id: string;
  title: string;
  description: string;
  file?: File | null;
  onFileChange?: (file: File | null) => void;
};

export function DocumentUploadCard({
  id,
  title,
  description,
  file = null,
  onFileChange,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const nextFile = input.files?.[0] ?? null;

    if (!nextFile) return;

    const validationError = validateDocumentFile(nextFile);

    if (validationError) {
      setError(validationError);
      input.value = "";
      return;
    }

    setError(null);
    onFileChange?.(nextFile);
    input.value = "";
  }

  function handleRemove() {
    setError(null);
    onFileChange?.(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-w-0 flex-col rounded-md border border-dashed bg-muted/20 p-4 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-medium text-foreground">
            <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
              {title}
            </Label>
          </h3>
          <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={DOCUMENT_FILE_ACCEPT}
        className="sr-only"
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        aria-invalid={error ? true : undefined}
        onChange={handleFileChange}
      />

      {file ? (
        <div className="mt-4 flex min-w-0 items-center gap-2 rounded-sm border bg-background px-3 py-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {getFileTypeLabel(file)} · {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label={`Remove ${file.name}`}
            onClick={handleRemove}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-sm border border-dashed bg-background px-3 py-3 text-center">
          <p className="text-xs text-muted-foreground">No file selected</p>
        </div>
      )}

      {error ? (
        <p id={errorId} role="alert" className="mt-3 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          aria-controls={id}
          onClick={openFilePicker}
        >
          <Upload aria-hidden="true" />
          {file ? "Replace file" : "Upload file"}
        </Button>
      </div>
    </div>
  );
}
