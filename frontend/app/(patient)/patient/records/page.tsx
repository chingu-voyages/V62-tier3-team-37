import type { Metadata } from "next";
import { PatientRecords } from "@/components/features/Patient/records/PatientRecords";

export const metadata: Metadata = {
  title: "Health records",
};

/**
 * Patient-uploaded files.
 *
 * The list is read in the browser rather than on the server: the uploads are
 * `FormData` and every mutation here is a client-side request, so there is
 * nothing to gain from rendering them through a Server Component.
 */
export default function PatientRecordsPage() {
  return <PatientRecords />;
}
