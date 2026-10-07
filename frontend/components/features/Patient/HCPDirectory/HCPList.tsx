import type { HCP } from "@/types/hcp-directory";
import type { BookingValues } from "./HCPBookingDialog";
import { HCPListItem } from "./HCPListItem";

type HCPListProps = {
  hcps: HCP[];
  onViewProfile?: (hcpId: string) => void;
  onBookRequest?: (hcp: HCP, values: BookingValues) => void;
};

export function HCPList({ hcps, onViewProfile, onBookRequest }: HCPListProps) {
  return (
    <div className="flex flex-col gap-4">
      {hcps.map((hcp) => (
        <HCPListItem
          key={hcp.id}
          hcp={hcp}
          onViewProfile={onViewProfile}
          onBookRequest={onBookRequest}
        />
      ))}
    </div>
  );
}
