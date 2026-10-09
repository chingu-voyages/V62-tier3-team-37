"use client";

import { BadgeCheck, CalendarPlus, MapPin, Star } from "lucide-react";
import { type FC, type ReactNode, useCallback, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { HCP } from "@/types/hcp-directory";

import { doctorInitials } from "../Booking/DoctorSummary";
import { HCPBookingDialog } from "./HCPBookingDialog";

// TODO: derive from the HCP's market/locale instead of hardcoding.
const DEFAULT_CURRENCY = "EGP";

type HCPListItemProps = {
  hcp: HCP;
  onViewProfile?: (hcpId: string) => void;
};

type HCPSummary = {
  specialtyLabel: string | null;
  allSpecialties: string;
  subtitle: string | null;
  location: string | null;
  experience: string | null;
  fee: string | null;
};

const formatYears = (years: number): string => {
  return `${years} ${years === 1 ? "year" : "years"}`;
};

/** Pure view-model: all "what do we show?" decisions live here, not in JSX. */
const buildSummary = (hcp: HCP): HCPSummary => {
  const [primary, ...rest] = hcp.specialties;

  let specialtyLabel: string | null = null;
  if (primary) {
    specialtyLabel = rest.length > 0 ? `${primary} +${rest.length}` : primary;
  }

  // The title often repeats the specialty ("CARDIOLOGY" twice) - hide the echo.
  const title = hcp.title?.trim();
  const isTitleDuplicate = title?.toLowerCase() === primary?.toLowerCase();

  const location = [hcp.city, hcp.area].filter(Boolean).join(", ");

  return {
    specialtyLabel,
    allSpecialties: hcp.specialties.join(", "),
    subtitle: title && !isTitleDuplicate ? title : null,
    location: location || null,
    experience: hcp.yearsOfExperience !== undefined ? formatYears(hcp.yearsOfExperience) : null,
    fee: hcp.fees !== undefined ? `${hcp.currency ?? DEFAULT_CURRENCY} ${hcp.fees}` : null,
  };
};

/**
 * Opening the dialog is local state, so the list stays uncontrolled and the
 * dialog does not have to be lifted into the directory.
 */
const useHCPListItem = (hcp: HCP) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const summary = useMemo(() => buildSummary(hcp), [hcp]);
  const openBooking = useCallback(() => setIsBookingOpen(true), []);
  const closeBooking = useCallback(() => setIsBookingOpen(false), []);

  return { summary, isBookingOpen, openBooking, closeBooking };
};

type HCPAvatarProps = {
  name: string;
  src?: string;
  isVerified?: boolean;
};

/** Squircle echoes the squared HealthHub logo; the verified mark sits on the photo, not in the name row. */
const HCPAvatar: FC<HCPAvatarProps> = ({ name, src, isVerified }) => {
  return (
    <div className="relative shrink-0">
      <Avatar className="size-16 rounded-2xl ring-1 ring-border">
        <AvatarImage src={src} alt="" />
        <AvatarFallback className="rounded-none bg-accent font-heading type-h3 text-primary">
          {doctorInitials(name)}
        </AvatarFallback>
      </Avatar>
      {isVerified ? (
        <span
          role="img"
          aria-label="Verified professional"
          className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-card"
        >
          <BadgeCheck className="size-5 fill-primary text-primary-foreground" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
};

type HCPStatProps = {
  label: string;
  children: ReactNode;
};

const HCPStat: FC<HCPStatProps> = ({ label, children }) => {
  return (
    <div className="min-w-0 px-4 first:pl-0 last:pr-0">
      <dt className="type-helper text-muted-foreground">{label}</dt>
      <dd className="mt-1 type-label font-medium text-foreground tabular-nums">{children}</dd>
    </div>
  );
};

type HCPRatingProps = {
  rating?: number;
  reviewCount?: number;
};

const HCPRating: FC<HCPRatingProps> = ({ rating, reviewCount }) => {
  if (rating === undefined) {
    return <span className="font-normal text-muted-foreground">No reviews yet</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating.toFixed(1)}
      {reviewCount !== undefined ? (
        <span className="font-normal text-muted-foreground">({reviewCount})</span>
      ) : null}
    </span>
  );
};

/**
 * Two-band HCP card.
 * Top band: who they are + what to do (identity, location, actions).
 * Bottom band: the facts patients compare (experience, fee, rating).
 */
export const HCPListItem: FC<HCPListItemProps> = ({ hcp, onViewProfile }) => {
  const { summary, isBookingOpen, openBooking, closeBooking } = useHCPListItem(hcp);

  return (
    <>
      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-[border-color] duration-200 ease-out focus-within:border-primary/40 hover:border-primary/30">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />

        <div className="flex flex-col gap-4 p-4 pl-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6 md:pl-7">
          <div className="flex min-w-0 items-start gap-4">
            <HCPAvatar name={hcp.fullName} src={hcp.avatar} isVerified={hcp.verified} />

            <div className="min-w-0">
              {summary.specialtyLabel ? (
                <p
                  title={summary.allSpecialties}
                  className="type-body font-extrabold tracking-wide text-primary uppercase"
                >
                  {summary.specialtyLabel}
                </p>
              ) : null}

              <h3 className="mt-1 type-h3 text-balance text-foreground">{hcp.fullName}</h3>

              {summary.subtitle ? (
                <p className="type-label text-muted-foreground">{summary.subtitle}</p>
              ) : null}

              {summary.location ? (
                <p className="mt-2 flex items-center font-medium bg-gray-400/20 px-2 rounded-4xl gap-2 type-helper text-muted-foreground">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  {summary.location}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full gap-2 md:w-auto md:shrink-0">
            {onViewProfile ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 md:flex-none"
                onClick={() => onViewProfile(hcp.id)}
              >
                View profile
              </Button>
            ) : null}
            <Button
              type="button"
              className="h-11 flex-1 gap-2 px-6 md:flex-none"
              onClick={openBooking}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Book appointment
            </Button>
          </div>
        </div>

        <dl className="grid auto-cols-fr grid-flow-col divide-x divide-border border-t border-border bg-accent/40 py-3 pr-4 pl-5 md:py-4 md:pr-6 md:pl-7">
          {summary.experience ? <HCPStat label="Experience">{summary.experience}</HCPStat> : null}
          {summary.fee ? <HCPStat label="Consultation fee">{summary.fee}</HCPStat> : null}
          <HCPStat label="Rating">
            <HCPRating rating={hcp.rating} reviewCount={hcp.reviewCount} />
          </HCPStat>
        </dl>
      </article>

      <HCPBookingDialog hcp={isBookingOpen ? hcp : null} onClose={closeBooking} />
    </>
  );
};
