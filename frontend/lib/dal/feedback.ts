import "server-only";

import { serverRequest } from "@/lib/api/server-client";

export type FeedbackClinician = {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string | null;
};

/**
 * Clinicians a patient may review: the accepted subset of the directory.
 *
 * Server-side because `/patient/feedback` renders on the server; the browser
 * client cannot read the session cookie.
 */
export async function getFeedbackClinicians(): Promise<FeedbackClinician[]> {
  const response = await serverRequest<{ data: FeedbackClinician[] }>("/api/patient/clinicians");
  return response.data;
}
