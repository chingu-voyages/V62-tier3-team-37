import { PatientAppointments } from "@/components/features/patient/Appointments/PatientAppointments";

export default async function PatientHomePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : undefined;

  return (
    <div className="w-full">
      <PatientAppointments initialDay={day} />
    </div>
  );
}
