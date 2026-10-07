"use client";

import { BadgeCheck, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { HCP } from "@/types/hcp-directory";
import { type BookingValues, HCPBookingDialog } from "./HCPBookingDialog";

type HCPListItemProps = {
  hcp: HCP;
  onViewProfile?: (hcpId: string) => void;
  onBookRequest?: (hcp: HCP, values: BookingValues) => void;
};

/**
 * Compact HCP row: identity on the left, one meta line, one booking action.
 * Opening the booking dialog is local state so the list can stay uncontrolled.
 */
export function HCPListItem({ hcp, onViewProfile, onBookRequest }: HCPListItemProps) {
  const [booking, setBooking] = useState(false);

  const initials = hcp.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border sm:flex-row sm:items-center">
        <Avatar className="size-14 shrink-0">
          <AvatarImage src={hcp.avatar} alt="" />
          <AvatarFallback className="font-heading type-h3">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-h3 text-foreground">{hcp.fullName}</h3>
            {hcp.verified && (
              <BadgeCheck
                className="size-5 stroke-2.5 text-secondary"
                aria-label="Verified professional"
              />
            )}
            {hcp.specialties[0] && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary">
                {hcp.specialties[0]}
                {hcp.specialties.length > 1 && ` +${hcp.specialties.length - 1}`}
              </span>
            )}
          </div>

          <p className="mt-1 type-body text-muted-foreground">{hcp.title}</p>

          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 type-label text-muted-foreground">
            {(hcp.city || hcp.area) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {[hcp.city, hcp.area].filter(Boolean).join(", ")}
              </span>
            )}
            {hcp.fees !== undefined && (
              <span>
                {hcp.currency ?? "EGP"} {hcp.fees}
              </span>
            )}
            {hcp.yearsOfExperience !== undefined && <span>{hcp.yearsOfExperience} years</span>}
            {hcp.rating !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {hcp.rating.toFixed(1)}
                {hcp.reviewCount !== undefined && ` (${hcp.reviewCount})`}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onViewProfile && (
            <Button type="button" variant="outline" size="sm" onClick={() => onViewProfile(hcp.id)}>
              View profile
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => setBooking(true)}>
            Book
          </Button>
        </div>
      </article>

      <HCPBookingDialog
        hcp={booking ? hcp : null}
        onClose={() => setBooking(false)}
        onRequest={onBookRequest}
      />
    </>
  );
}
