import type { HCP } from "@/types/hcp-directory";
import { HCPListItem } from "./HCPListItem";

type HCPListProps = {
  hcps: HCP[];
  onBook?: (hcpId: string) => void;
  onFavorite?: (hcpId: string) => void;
};

export function HCPList({ hcps, onBook, onFavorite }: HCPListProps) {
  return (
    <div className="flex flex-col gap-4">
      {hcps.map((hcp) => (
        <HCPListItem key={hcp.id} hcp={hcp} onBook={onBook} onFavorite={onFavorite} />
      ))}
    </div>
  );
}
