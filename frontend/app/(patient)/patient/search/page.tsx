import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

/** Doctor search now lives on the landing page, which is the patient home. */
export default function PatientDoctorsPage() {
  redirect(ROUTES.home);
}
