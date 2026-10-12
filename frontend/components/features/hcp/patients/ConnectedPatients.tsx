"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { getApiErrorMessage, listConnectedPatients } from "@/lib/api/visit-client";
import { ROUTES } from "@/lib/constants/routes";
import Link from "next/link";

type PatientRow = { id: number; name: string; email: string | null };

export function ConnectedPatients() {
  const [patients, setPatients] = useState<PatientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listConnectedPatients()
      .then((response) => setPatients(response.data))
      .catch((cause) => {
        setPatients([]);
        setError(getApiErrorMessage(cause));
      });
  }, []);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="type-h1 text-foreground">Connected patients</h1>
        <p className="mt-2 type-body text-muted-foreground">
          People who have booked a visit with you.
        </p>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {patients === null ? (
        <p className="type-body text-muted-foreground">Loading patients…</p>
      ) : patients.length === 0 ? (
        <p className="rounded-2xl bg-accent px-5 py-10 text-center type-body text-muted-foreground">
          No connected patients yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {patients.map((patient) => (
            <li key={patient.id} className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="type-h3 text-foreground">{patient.name}</h2>
                <p className="mt-1 type-body text-muted-foreground">{patient.email}</p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.hcpMessages}?with=${patient.id}`}>Message</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
