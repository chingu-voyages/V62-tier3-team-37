"use client";

import { BadgeCheck, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PatientBookingPanel, type BookingPatient } from "@/components/features/landing/PatientBookingPanel";
import { getApiErrorMessage, listFeaturedClinicians, type DirectoryClinician } from "@/lib/api/visit-client";
import type { HCP } from "@/types/hcp-directory";

export function FeaturedClinicians({ patient }: { patient: BookingPatient }) {
  const [clinicians, setClinicians] = useState<DirectoryClinician[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<HCP | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFeaturedClinicians()
      .then((response) => {
        if (!cancelled) setClinicians(response.data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setClinicians([]);
          setError(getApiErrorMessage(cause));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="featured-clinicians" className="border-t border-border bg-background">
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="featured-clinicians" className="type-h2 text-foreground">
          Featured doctors
        </h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          {clinicians?.some((clinician) => (clinician.review_count ?? 0) > 0)
            ? "Clinicians patients have rated 4 or higher."
            : "Accepted clinicians you can book from here."}
        </p>
        {error ? <p className="mt-6 type-body text-destructive">{error}</p> : null}
        {clinicians === null ? (
          <p className="mt-8 type-body text-muted-foreground">Loading featured doctors…</p>
        ) : clinicians.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-card px-5 py-10 text-center type-body text-muted-foreground shadow-soft">
            Strong reviews will show here after a patient rates a visit.
          </p>
        ) : (
          <ul className="mt-8 grid gap-3 lg:grid-cols-2">
            {clinicians.map((clinician) => (
              <li key={clinician.id}>
                <article className="flex h-full flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="type-h3 text-foreground">{clinician.full_name}</h3>
                      <BadgeCheck className="size-5 text-secondary" aria-label="Verified professional" />
                    </div>
                    <p className="mt-1 type-body text-muted-foreground">
                      {clinician.specialty_label || clinician.workplace_name || "Clinician"}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 type-label text-muted-foreground">
                      {(clinician.review_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Star className="size-3.5 text-primary" aria-hidden="true" />
                          {clinician.rating?.toFixed(1)} · {clinician.review_count}{" "}
                          {clinician.review_count === 1 ? "review" : "reviews"}
                        </span>
                      ) : null}
                      {clinician.city ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {[clinician.city, clinician.workplace_address].filter(Boolean).join(", ")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Button type="button" className="sm:shrink-0" onClick={() => setBooking(toDoctor(clinician))}>
                    Book visit
                  </Button>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PatientBookingPanel doctor={booking} patient={patient} onClose={() => setBooking(null)} />
    </section>
  );
}

function toDoctor(clinician: DirectoryClinician): HCP {
  return {
    id: String(clinician.id),
    fullName: clinician.full_name,
    title: clinician.workplace_name ?? clinician.specialty_label ?? "Clinician",
    verified: true,
    specialties: clinician.specialty_label ? [clinician.specialty_label] : [],
    city: clinician.city ?? undefined,
    area: clinician.workplace_address ?? undefined,
    rating: clinician.rating ?? undefined,
    reviewCount: clinician.review_count,
  };
}
