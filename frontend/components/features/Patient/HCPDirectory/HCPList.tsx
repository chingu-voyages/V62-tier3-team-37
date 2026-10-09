import type { HCP } from "@/types/hcp-directory";

import type { BookingPatient } from "../Booking/booking-types";
import { HCPListItem } from "./HCPListItem";

type HCPListProps = {
  hcps: HCP[];
  /**
   * The signed-in patient. Same value on every row - the page resolves it once and
   * this just forwards it, so no row can end up booking against a different
   * identity than its neighbour.
   */
  patient: BookingPatient;
  onViewProfile?: (hcpId: string) => void;
};

export function HCPList({ hcps, patient, onViewProfile }: HCPListProps) {
  return (
    <div className="flex flex-col gap-4">
      {hcps.map((hcp) => (
        <HCPListItem key={hcp.id} hcp={hcp} patient={patient} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
}
