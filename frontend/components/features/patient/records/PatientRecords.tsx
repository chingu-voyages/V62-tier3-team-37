"use client";

import { Download, Eye, FileText, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  downloadRecordDocument,
  listMedicalRecords,
  type MedicalRecord,
  openRecordDocument,
  type RecordDocument,
} from "@/lib/api/records-client";
import { formatFileSize } from "@/lib/validation/files";

/**
 * Documents shown on a card before it offers to show the rest.
 *
 * A clinician who has written twelve results should not stretch one card down the
 * page. Three is enough to recognise the folder; the rest live behind a dialog.
 */
const VISIBLE_DOCUMENTS = 3;

/**
 * A patient's medical records, grouped by the clinician who wrote them.
 *
 * Patients do not upload anything here. Every file on this page was attached by a
 * clinician to a visit they completed, so the page reads as a history of care
 * rather than a file manager: who saw you, and what they left behind.
 */
export function PatientRecords() {
  const [records, setRecords] = useState<MedicalRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMedicalRecords()
      .then((response) => {
        if (!cancelled) setRecords(response.data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setRecords([]);
          setError(getApiErrorMessage(cause));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalDocuments = records?.reduce((sum, record) => sum + record.documents.length, 0) ?? 0;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="type-h2 text-foreground">Health records</h1>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          {records === null
            ? "Documents your clinicians left after a visit."
            : totalDocuments === 0
              ? "Documents your clinicians left after a visit appear here."
              : `${totalDocuments} document${totalDocuments === 1 ? "" : "s"} from ${records.length} clinician${records.length === 1 ? "" : "s"}. Open or download any of them.`}
        </p>
      </div>

      {error ? <Callout tone="danger">{error}</Callout> : null}

      {records === null ? (
        <RecordSkeleton />
      ) : records.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-10 text-center shadow-soft ring-1 ring-border">
          <Stethoscope className="mx-auto size-8 text-muted-foreground/70" aria-hidden="true" />
          <p className="mt-4 type-body text-muted-foreground">
            No records yet. When a clinician finishes a visit and shares a result with you, it
            appears here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => (
            <RecordCard key={record.hcp.id} record={record} onShowAll={() => setExpanded(record)} />
          ))}
        </div>
      )}

      <RecordsDialog record={expanded} onClose={() => setExpanded(null)} />
    </div>
  );
}

/**
 * One clinician: who they are on top, what they shared underneath.
 *
 * Kept as a single card so a patient reads "this is my dermatologist, here is what
 * she gave me" without having to remember which folder a file came from.
 */
function RecordCard({ record, onShowAll }: { record: MedicalRecord; onShowAll: () => void }) {
  const { hcp } = record;
  const visible = record.documents.slice(0, VISIBLE_DOCUMENTS);
  const hidden = record.documents.length - visible.length;

  return (
    <article className="flex flex-col rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
      <header className="flex items-start gap-3">
        <Avatar className="size-14 shrink-0">
          {hcp.profile_photo_url ? <AvatarImage src={hcp.profile_photo_url} alt="" /> : null}
          <AvatarFallback className="bg-accent type-h3 font-semibold text-primary">
            {initials(hcp.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h2 className="truncate type-h3 text-foreground">{hcp.full_name}</h2>
          {hcp.specialty_label ? (
            <p className="mt-0.5 truncate type-label text-primary">{hcp.specialty_label}</p>
          ) : null}
          <p className="mt-1 truncate type-helper text-muted-foreground">{hcp.email}</p>
          {hcp.city ? (
            <p className="truncate type-helper text-muted-foreground">{hcp.city}</p>
          ) : null}
        </div>
      </header>

      <p className="mt-4 type-helper text-muted-foreground">
        {record.documents.length} document{record.documents.length === 1 ? "" : "s"}
        {record.visits_count > 0
          ? ` · ${record.visits_count} visit${record.visits_count === 1 ? "" : "s"}`
          : ""}
      </p>

      <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        {visible.map((document) => (
          <DocumentRow key={document.id} document={document} />
        ))}
      </ul>

      {hidden > 0 ? (
        <Button type="button" variant="ghost" className="mt-3 self-start" onClick={onShowAll}>
          See all {record.documents.length} documents
        </Button>
      ) : null}
    </article>
  );
}

function DocumentRow({ document }: { document: RecordDocument }) {
  const [busy, setBusy] = useState<"open" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "open" | "download") {
    setBusy(action);
    setError(null);
    try {
      if (action === "open") {
        await openRecordDocument(document);
      } else {
        await downloadRecordDocument(document);
      }
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
      <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate type-label text-foreground">{document.title}</p>
        <p className="truncate type-helper text-muted-foreground">{describe(document)}</p>
        {error ? (
          <p role="alert" className="truncate type-helper text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy !== null}
          aria-label={`Open ${document.title}`}
          onClick={() => run("open")}
        >
          <Eye aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Open</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy !== null}
          aria-label={`Download ${document.title}`}
          onClick={() => run("download")}
        >
          <Download aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Save</span>
        </Button>
      </div>
    </li>
  );
}

/**
 * The full folder for one clinician, for when a card truncates it.
 *
 * Same rows as the card so opening the dialog is an expansion of what was already
 * on screen rather than a second, differently-styled document list.
 */
function RecordsDialog({ record, onClose }: { record: MedicalRecord | null; onClose: () => void }) {
  return (
    <Dialog
      open={record !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {record ? (
          <>
            <DialogHeader className="items-start">
              <DialogTitle>{record.hcp.full_name}</DialogTitle>
              <DialogDescription>
                {[
                  record.hcp.specialty_label,
                  record.hcp.city,
                  `${record.documents.length} document${record.documents.length === 1 ? "" : "s"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {record.documents.map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </ul>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border"
        >
          <div className="flex items-center gap-3">
            <div className="size-14 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A one-line description of a file: name, size, and when it was shared. */
function describe(document: RecordDocument): string {
  const parts: string[] = [];

  if (document.file_size_bytes) {
    parts.push(formatFileSize(document.file_size_bytes));
  }
  if (document.uploaded_at) {
    parts.push(
      new Date(document.uploaded_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }

  return parts.join(" · ");
}

function initials(name: string): string {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return letters.toUpperCase() || "H";
}
