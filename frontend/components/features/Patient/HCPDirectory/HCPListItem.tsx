import { BadgeCheck, Clock, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HCP } from "@/types/hcp";

type HCPListItemProps = {
  hcp: HCP;
  onBook?: (hcpId: string) => void;
  onFavorite?: (hcpId: string) => void;
};

export function HCPListItem({ hcp, onBook, onFavorite }: HCPListItemProps) {
  const initials = hcp.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-5 rounded-2xl bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <Avatar className="size-16 shrink-0 md:size-20">
        <AvatarImage src={hcp.avatar} alt={hcp.fullName} />
        <AvatarFallback className="type-h3">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="type-h3 text-foreground">{hcp.fullName}</h3>
          {hcp.verified && (
            <BadgeCheck
              className="size-5 shrink-0 text-secondary"
              aria-label="Verified professional"
            />
          )}
        </div>

        <p className="type-body text-muted-foreground">{hcp.title}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 type-label text-muted-foreground">
          {hcp.specialties.length > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 type-helper text-primary">
              {hcp.specialties[0]}
              {hcp.specialties.length > 1 && ` +${hcp.specialties.length - 1}`}
            </span>
          )}
          {hcp.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {hcp.city}
              {hcp.area ? `, ${hcp.area}` : ""}
            </span>
          )}
          {hcp.fees !== undefined && (
            <span>
              {hcp.currency ?? "EGP"} {hcp.fees}
            </span>
          )}
          {hcp.waitingTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {hcp.waitingTime}
            </span>
          )}
        </div>

        {hcp.rating !== undefined && (
          <div className="flex items-center gap-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="type-label text-foreground">{hcp.rating.toFixed(1)}</span>
            {hcp.reviewCount !== undefined && (
              <span className="type-helper text-muted-foreground">({hcp.reviewCount} reviews)</span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        {onBook && (
          <Button size="sm" onClick={() => onBook(hcp.id)}>
            Book
          </Button>
        )}
        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(hcp.id)}
            aria-label={`Favorite ${hcp.fullName}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <Star className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
