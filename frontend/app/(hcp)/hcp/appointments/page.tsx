import { HcpAppointments } from "@/components/features/hcp/appointments/HcpAppointments";

/**
 * The clinician's schedule.
 *
 * A plain client screen rather than the profile's parallel routes: it is one list
 * driven by one query, so there is nothing to load or fail independently. The role
 * and the verification gate are already enforced by the `(hcp)` layout and by
 * `hcp.verified` respectively.
 */
export default function HcpAppointmentsPage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <HcpAppointments />
    </div>
  );
}
