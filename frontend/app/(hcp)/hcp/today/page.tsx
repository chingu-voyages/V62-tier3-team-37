import { redirect } from "next/navigation";
import { HcpDayDesk } from "@/components/features/hcp/visits/HcpDayDesk";
import { ROUTES } from "@/lib/constants/routes";
import { getHcpVerificationSummary } from "@/lib/dal/hcp";

export default async function TodayPage() {
  let accepted = false;
  try {
    accepted = (await getHcpVerificationSummary()).requestDecision === "accepted";
  } catch {
    accepted = false;
  }

  if (!accepted) {
    redirect(ROUTES.hcpProfile);
  }

  return (
    <HcpDayDesk />
  );
}
