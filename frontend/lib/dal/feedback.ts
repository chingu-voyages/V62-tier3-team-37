import "server-only";

import { serverRequest } from "@/lib/api/server-client";

export type FeedbackClinician = {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string | null;
};

export async function getFeedbackClinicians(): Promise<FeedbackClinician[]> {
  const response = await serverRequest<{ data: FeedbackClinician[] }>("/api/patient/clinicians");
  return response.data;
}
