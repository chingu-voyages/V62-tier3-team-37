import type { HCP } from "@/types/hcp-directory";
import { HCPListItem } from "./HCPListItem";

type HCPListProps = {
  hcps: HCP[];
  onViewProfile?: (hcpId: string) => void;
};

export function HCPList({ hcps, onViewProfile }: HCPListProps) {
  return (
    <div className="flex flex-col gap-4">
      {hcps.map((hcp) => (
        <HCPListItem key={hcp.id} hcp={hcp} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
}
