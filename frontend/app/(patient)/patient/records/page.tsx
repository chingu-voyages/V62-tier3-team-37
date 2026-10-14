import type { Metadata } from "next";
import { PatientRecords } from "@/components/features/patient/records/PatientRecords";

export const metadata: Metadata = {
  title: "Health records",
};

export default function PatientRecordsPage() {
  return <PatientRecords />;
}
