"use client";

import { FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  deleteMedicalExamination,
  listMedicalExaminations,
  type MedicalExamination,
  openMedicalExamination,
  uploadMedicalExaminations,
} from "@/lib/api/records-client";

const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/png";

/**
 * Patient health records: upload, open and delete the files on their account.
 *
 * `records` is `null` while the first read is in flight, which is what separates
 * "still loading" from "loaded and empty" - collapsing the two used to flash
 * "No files yet" at someone whose upload was simply still being fetched.
 *
 * The list is re-read after a mutation rather than patched locally, so what is
 * on screen always matches what the server stored.
 */
export function PatientRecords() {
  const [records, setRecords] = useState<MedicalExamination[] | null>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const response = await listMedicalExaminations();
    setRecords(response.data);
  }, []);

  useEffect(() => {
    // A mutation may resolve after this component unmounts; without the guard
    // React warns about setting state on an unmounted component.
    let cancelled = false;

    listMedicalExaminations()
      .then((response) => {
        if (!cancelled) setRecords(response.data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setRecords([]);
        setError(getApiErrorMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function upload() {
    if (files.length === 0) {
      setError("Choose a file to upload.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await uploadMedicalExaminations(title, files);
      await refresh();
      setTitle("");
      // `files` is a File[], not a string. Resetting it to "" left the control
      // holding a phantom entry and broke the next upload's length check.
      setFiles([]);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await deleteMedicalExamination(id);
      setRecords((current) => current?.filter((record) => record.id !== id) ?? null);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    }
  }

  async function open(id: number) {
    setError(null);
    try {
      await openMedicalExamination(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That file could not be opened.");
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="type-h2 text-foreground">Health records</h1>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Files you upload stay on your account. The clinic does not see them from here.
        </p>
      </div>

      <section className="max-w-xl rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
        <h2 className="type-h3 text-foreground">Add a file</h2>
        <div className="mt-4 flex flex-col gap-4">
          <TextField
            id="record-title"
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="Blood test, scan, or letter"
          />
          <div>
            <label htmlFor="record-files" className="mb-1 block type-label text-foreground">
              Files
            </label>
            <input
              id="record-files"
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="block w-full type-body text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:type-label file:text-primary"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </div>
          <Button
            type="button"
            className="self-start"
            disabled={saving}
            onClick={() => void upload()}
          >
            {saving ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </section>

      {error ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}

      {records === null ? (
        <p className="type-body text-muted-foreground">Loading your files…</p>
      ) : records.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-10 text-center type-body text-muted-foreground shadow-soft ring-1 ring-border">
          No files yet. Upload a result or a letter when you have one.
        </p>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-3">
          {records.map((record) => {
            const name = record.title || record.original_file_name;
            return (
              <li key={record.id}>
                <article className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border sm:flex-row sm:items-center">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="type-h3 text-foreground">{name}</p>
                    <p className="mt-1 truncate type-helper text-muted-foreground">
                      {record.uploaded_at
                        ? `${record.original_file_name} · ${new Date(
                            record.uploaded_at,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : record.original_file_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => void open(record.id)}>
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Delete ${name}`}
                      onClick={() => void remove(record.id)}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
